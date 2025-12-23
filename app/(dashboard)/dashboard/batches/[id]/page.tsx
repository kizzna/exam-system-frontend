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
            <div className="flex items-center justify-center">
                <h1 className="text-3xl font-bold">รายละเอียดการอัปโหลดใบตอบ</h1>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">รายละเอียด</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                    <BatchDetailsCard batchId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
