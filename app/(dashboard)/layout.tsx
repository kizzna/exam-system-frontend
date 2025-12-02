'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useUIStore } from '@/lib/stores/ui-store';
import {
  Users,
  Upload,
  CheckSquare,
  FileText,
  GraduationCap,
  Download,
  Search,
  FileSearch,
  Menu,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Menu },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Batches', href: '/dashboard/batches', icon: Upload },
  { name: 'Profiles', href: '/dashboard/profiles', icon: Upload },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Review', href: '/dashboard/review', icon: FileText },
  { name: 'Grading', href: '/dashboard/grading/answer-keys', icon: GraduationCap },
  { name: 'Exports', href: '/dashboard/grading/exports', icon: Download },
  { name: 'Students', href: '/dashboard/students', icon: Search },
  { name: 'Audit', href: '/dashboard/audit', icon: FileSearch },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-bold">Exam System</h1>
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-accent rounded-md"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>

        {/* Floating Toggle Button (Visible only when sidebar is closed) */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2 bg-card border border-border shadow-md rounded-md hover:bg-accent"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
