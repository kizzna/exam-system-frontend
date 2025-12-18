'use client';

import { AuditLogTable } from '@/components/audit/audit-log-table';
import { useAuth } from '@/lib/providers/auth-provider';

export default function AuditPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="h-full flex flex-col space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ประวัติการตรวจข้อสอบ</h1>
      </div>
      <div className="flex-1">
        <AuditLogTable showUsernameFilter={isAdmin} />
      </div>
    </div>
  );
}
