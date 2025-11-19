'use client';

import { useAuth } from '@/lib/providers/auth-provider';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg shadow">
        <p className="text-lg">Welcome back, {user?.full_name}!</p>
        <p className="text-muted-foreground mt-2">
          Select an option from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
