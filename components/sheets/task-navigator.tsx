'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TaskReviewNavigatorProps {
    currentTaskId: number;
}

export function useTaskNavigation(currentTaskId: number) {
    const searchParams = useSearchParams();
    const router = useRouter();

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

    const { data } = useQuery({
        queryKey: ['tasks', listParams],
        queryFn: () => tasksApi.getTasks(listParams),
        staleTime: 5000,
    });

    // Helper to calculate target
    const getTargetTask = (direction: 'prev' | 'next', tasks: any[], currentIndex: number) => {
        if (currentIndex === -1) return null;
        if (direction === 'prev' && currentIndex > 0) return tasks[currentIndex - 1];
        if (direction === 'next' && currentIndex < tasks.length - 1) return tasks[currentIndex + 1];
        return null;
    };

    // Calculate Prev/Next state
    const tasks = data?.items || [];
    const currentIndex = tasks.findIndex((t: any) => t.task_id === currentTaskId);
    const total = data?.total || 0;

    // Adjacent Page Handling
    const prevPage = listParams.page - 1;
    const nextPage = listParams.page + 1;

    // We only fetch adjacent if necessary (boundary)
    const needPrevPage = currentIndex === 0 && listParams.page > 1;
    const needNextPage = currentIndex === tasks.length - 1 && (listParams.page * listParams.size < total);

    const { data: prevPageData } = useQuery({
        queryKey: ['tasks', { ...listParams, page: prevPage }],
        queryFn: () => tasksApi.getTasks({ ...listParams, page: prevPage }),
        enabled: needPrevPage,
        staleTime: 10000,
    });

    const { data: nextPageData } = useQuery({
        queryKey: ['tasks', { ...listParams, page: nextPage }],
        queryFn: () => tasksApi.getTasks({ ...listParams, page: nextPage }),
        enabled: needNextPage,
        staleTime: 10000,
    });

    const navigateToTask = (taskId: number, page?: number) => {
        const query = { ...Object.fromEntries(searchParams.entries()) };
        if (page) query.page = page.toString();

        // Construct URL manually to avoid complex object passing
        const queryString = new URLSearchParams(query as any).toString();
        router.push(`/dashboard/sheets/review/${taskId}?${queryString}`);
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            navigateToTask(tasks[currentIndex - 1].task_id);
        } else if (needPrevPage && prevPageData?.items?.length) {
            const items = prevPageData.items;
            navigateToTask(items[items.length - 1].task_id, prevPage);
        }
    };

    const handleNext = () => {
        if (currentIndex !== -1 && currentIndex < tasks.length - 1) {
            navigateToTask(tasks[currentIndex + 1].task_id);
        } else if (needNextPage && nextPageData?.items?.length) {
            navigateToTask(nextPageData.items[0].task_id, nextPage);
        }
    };

    // Compute availability for UI disabled states
    const hasPrev = (currentIndex > 0) || (needPrevPage && (prevPageData?.items?.length || 0) > 0);
    const hasNext = (currentIndex !== -1 && currentIndex < tasks.length - 1) || (needNextPage && (nextPageData?.items?.length || 0) > 0);

    return {
        handlePrev,
        handleNext,
        hasPrev,
        hasNext,
        isLoading: !data,
    };
}

export function TaskReviewNavigator({ currentTaskId }: TaskReviewNavigatorProps) {
    const { handlePrev, handleNext, hasPrev, hasNext } = useTaskNavigation(currentTaskId);

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

