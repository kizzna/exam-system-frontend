/**
 * Batches List Page
 * Phase 2: Batch Upload & Management
 */

'use client';

import { useState } from 'react';
import { BatchList, BatchUploadForm } from '@/components/batches';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function BatchesPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const isAdmin = useAuthStore((state) => state.isAdmin());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
          <p className="mt-1 text-gray-600">Upload and manage OMR sheet batches</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? 'Hide Upload Form' : 'Upload New Batch'}
        </Button>
      </div>

      {/* Upload Form (collapsible) */}
      {showUploadForm && <BatchUploadForm />}

      {/* Batch List */}
      <BatchList isAdmin={isAdmin} />
    </div>
  );
}
