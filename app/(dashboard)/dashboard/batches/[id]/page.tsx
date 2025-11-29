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
            <BatchDetailsCard batchId={id} />
            <BatchStatsCard batchId={id} />
        </div>
    );
}
