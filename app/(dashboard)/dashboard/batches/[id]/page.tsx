import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from '@/components/audit/audit-log-table';
import { BatchDetailsCard } from '@/components/batches/BatchDetailsCard';
import { BatchStatsCard } from '@/components/batches/BatchStatsCard';

interface BatchDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function BatchDetailsPage({ params }: BatchDetailsPageProps) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Batch Details</h1>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                    <BatchDetailsCard batchId={id} />
                    <BatchStatsCard batchId={id} />
                </TabsContent>
                <TabsContent value="history">
                    <div className="rounded-md border bg-card text-card-foreground shadow p-6">
                        <AuditLogTable
                            initialFilters={{ resource_type: 'batch', resource_id: id }}
                            showUsernameFilter={false} // Assume users inspecting a batch might not need to filter by user, or maybe they do? Let's leave it false or check role. But this is server component.
                        // To check role properly I need client component or check on server. 
                        // Easier to make this client component or just default false for context value.
                        // Since this is a server component, I can't use useAuth easily unless I wrapped it.
                        // But AuditLogTable is 'use client'.
                        // I'll leave showUsernameFilter optional/undefined which defaults to false/hidden if I didn't verify admin.
                        // Actually, I should probably let AuditLogTable handle "can I filter by user?" internally if possible, 
                        // or pass it from somewhere. But the plan said pass `showUsernameFilter`.
                        // For this context, let's keep it simple. If I want to support admin filter here, I need to check auth.
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
