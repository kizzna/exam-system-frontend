/**
 * Batch Details Page
 * Phase 2: View detailed batch information and progress
 */

'use client';

import { use } from 'react';
import { BatchDetailsCard } from '@/components/batches';
import { useAuthStore } from '@/lib/stores/auth-store';

interface BatchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = use(params);
  const isAdmin = useAuthStore((state) => state.isAdmin());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Batch Details</h1>
        <p className="mt-1 text-gray-600">View batch information and processing status</p>
      </div>

      <BatchDetailsCard batchId={id} isAdmin={isAdmin} />
    </div>
  );
}
