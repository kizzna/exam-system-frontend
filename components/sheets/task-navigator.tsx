'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TaskReviewNavigatorProps {
    currentTaskId: number;
}

export function TaskReviewNavigator({ currentTaskId }: TaskReviewNavigatorProps) {
    const searchParams = useSearchParams();

    // Parse list params from URL
    const listParams = {
        // Filters
        eval_center_id: searchParams.get('eval_center_id') ? Number(searchParams.get('eval_center_id')) : undefined,
        processing_status: searchParams.get('processing_status') || undefined,
        class_level: searchParams.get('class_level') ? Number(searchParams.get('class_level')) : undefined,
        exam_center_code: searchParams.get('exam_center_code') ? Number(searchParams.get('exam_center_code')) : undefined,
        latest_batch_id: searchParams.get('latest_batch_id') ? Number(searchParams.get('latest_batch_id')) : undefined,
        task_id: searchParams.get('task_id') || undefined,
        class_group: searchParams.get('class_group') ? Number(searchParams.get('class_group')) : undefined,
        error_count: searchParams.get('error_count') ? Number(searchParams.get('error_count')) : undefined,
        err_duplicate_sheets_count: searchParams.get('err_duplicate_sheets_count') ? Number(searchParams.get('err_duplicate_sheets_count')) : undefined,
        err_low_answer_count: searchParams.get('err_low_answer_count') ? Number(searchParams.get('err_low_answer_count')) : undefined,
        err_student_id_count: searchParams.get('err_student_id_count') ? Number(searchParams.get('err_student_id_count')) : undefined,
        err_exam_center_id_count: searchParams.get('err_exam_center_id_count') ? Number(searchParams.get('err_exam_center_id_count')) : undefined,
        err_class_group_count: searchParams.get('err_class_group_count') ? Number(searchParams.get('err_class_group_count')) : undefined,
        err_class_level_count: searchParams.get('err_class_level_count') ? Number(searchParams.get('err_class_level_count')) : undefined,
        err_absent_count: searchParams.get('err_absent_count') ? Number(searchParams.get('err_absent_count')) : undefined,

        // Pagination & Sorting
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        size: searchParams.get('size') ? Number(searchParams.get('size')) : 50,
        sort_by: searchParams.get('sort_by') || 'error_count',
        sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    // We need to know where the current task is in the list to determine Prev/Next.
    // Since we only have the current page number in params, we fetch the current page.
    // If the task is at the boundary (first or last of page), we might need adjacent pages.

    // Strategy:
    // 1. Fetch current page. Find index of current task.
    // 2. If index > 0, Prev is index-1.
    // 3. If index < length-1, Next is index+1.
    // 4. If index === 0, Prev is last item of Page-1. (Need to fetch Page-1)
    // 5. If index === length-1, Next is first item of Page+1. (Need to fetch Page+1)

    const [targetPage, setTargetPage] = useState(listParams.page);

    // Update target page if we detect we've navigated to a task not in the current URL page param
    // (This handles the case where user clicked "Next" effectively moving to a new page, but URL param might lag or we want to be proactive)
    // Actually, simpler: Always fetch the page defined in URL. If current task is NOT in it, we might be in trouble or URL is stale.
    // When we navigate, we update the URL, so the component re-renders with new page param.

    const { data, isLoading } = useQuery({
        queryKey: ['tasks', listParams],
        queryFn: () => tasksApi.getTasks(listParams),
        staleTime: 5000,
    });

    // Helper to build Link href conserving params
    const buildLink = (taskId: number, newPage?: number) => {
        const query = { ...Object.fromEntries(searchParams.entries()) };
        if (newPage) query.page = newPage.toString();
        return {
            pathname: `/dashboard/sheets/review/${taskId}`,
            query,
        };
    };

    if (isLoading || !data) return null;

    const tasks = data.items;
    const currentIndex = tasks.findIndex(t => t.task_id === currentTaskId);

    // Logic for Previous
    let prevLink = null;
    let prevDisabled = false;

    if (currentIndex > 0) {
        prevLink = buildLink(tasks[currentIndex - 1].task_id);
    } else if (listParams.page > 1) {
        // We are at start of page, need last item of previous page.
        // We can't know the ID without fetching.
        // Two options:
        // A) Just render a button that says "Prev Page" and takes to task list? No, requirement is task navigation.
        // B) Fetch previous page.
        // For simplicity v1: We can use a separate query or just enable the button but trigger a load?
        // Better: Fetch adjacent page if we are at boundary.
    }

    // Logic for Next
    let nextLink = null;
    let nextDisabled = false;

    if (currentIndex !== -1 && currentIndex < tasks.length - 1) {
        nextLink = buildLink(tasks[currentIndex + 1].task_id);
    } else if (currentIndex === -1) {
        // Task not found on this page.
        // This could happen if we just navigated from page X to X+1 but the task is actually on page X (race condition?)
        // OR we bookmarked a page.
    }

    // Advanced approach:
    // If currentIndex is 0, we need data from Page - 1.
    // If currentIndex is last, we need data from Page + 1.
    // We can use `keepPreviousData` or just separate queries.

    return (
        <div className="flex items-center gap-1">
            <NavigatorButton
                direction="prev"
                currentTaskId={currentTaskId}
                listParams={listParams}
                currentIndex={currentIndex}
                tasks={tasks}
                total={data.total}
            />
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <NavigatorButton
                direction="next"
                currentTaskId={currentTaskId}
                listParams={listParams}
                currentIndex={currentIndex}
                tasks={tasks}
                total={data.total}
            />
        </div>
    );
}

// Sub-component to handle logic for fetching adjacent pages if needed
function NavigatorButton({ direction, currentTaskId, listParams, currentIndex, tasks, total }: {
    direction: 'prev' | 'next';
    currentTaskId: number;
    listParams: any;
    currentIndex: number;
    tasks: any[];
    total: number;
}) {
    // Determine if we need to fetch adjacent page
    const isBoundary = direction === 'prev' ? currentIndex === 0 : currentIndex === tasks.length - 1;
    const canNavigate = direction === 'prev' ? (listParams.page > 1 || currentIndex > 0) : (listParams.page * listParams.size < total || currentIndex < tasks.length - 1);

    // Prepare Adjacent Query
    const adjacentPage = direction === 'prev' ? listParams.page - 1 : listParams.page + 1;
    const shouldFetch = isBoundary && canNavigate && currentIndex !== -1;

    const { data: adjacentData, isLoading } = useQuery({
        queryKey: ['tasks', { ...listParams, page: adjacentPage }],
        queryFn: () => tasksApi.getTasks({ ...listParams, page: adjacentPage }),
        enabled: shouldFetch,
        staleTime: 10000,
    });

    if (!canNavigate) {
        return (
            <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0 text-slate-400">
                {direction === 'prev' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
        );
    }

    let targetTaskId: number | undefined;
    let targetPage = listParams.page;

    if (!isBoundary && currentIndex !== -1) {
        targetTaskId = direction === 'prev' ? tasks[currentIndex - 1].task_id : tasks[currentIndex + 1].task_id;
    } else if (shouldFetch && adjacentData) {
        // If Prev, we want last item of prev page
        // If Next, we want first item of next page
        const items = adjacentData.items;
        if (items.length > 0) {
            targetTaskId = direction === 'prev' ? items[items.length - 1].task_id : items[0].task_id;
            targetPage = adjacentPage;
        }
    }

    if (!targetTaskId) {
        return (
            <Button variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0">
                {direction === 'prev' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
        );
    }

    const query = { ...listParams, page: targetPage };
    // Remove undefined keys
    Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);

    return (
        <Button size="sm" className="h-8 w-8 p-0 bg-blue-600 text-white hover:bg-red-600 border-transparent" asChild>
            <Link
                href={{
                    pathname: `/dashboard/sheets/review/${targetTaskId}`,
                    query: query,
                }}
            >
                {direction === 'prev' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Link>
        </Button>
    );
}
