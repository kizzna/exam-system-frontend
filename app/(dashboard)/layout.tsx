'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useUIStore } from '@/lib/stores/ui-store';
import Image from 'next/image';
import {
  Users,
  Upload,
  Cog,
  BookOpenCheck,
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
  { name: 'ผู้ใช้', href: '/dashboard/users', icon: Users, adminOnly: true },
  { name: 'อัปโหลดข้อสอบ', href: '/dashboard/batches', icon: Upload },
  { name: 'ตั้งค่าการตรวจ', href: '/dashboard/profiles', icon: Cog, adminOnly: true },
  { name: 'งานตรวจข้อสอบ', href: '/dashboard/tasks', icon: BookOpenCheck },
  { name: 'ตรวจสอบ', href: '/dashboard/review', icon: FileText, adminOnly: true },
  { name: 'ผลคะแนน', href: '/dashboard/grading/answer-keys', icon: GraduationCap, adminOnly: true },
  { name: 'บัญชีกรอกคะแนน', href: '/dashboard/grading/exports', icon: Download },
  { name: 'รายชื่อนักเรียน', href: '/dashboard/students', icon: Search },
  { name: 'ประวัติการตรวจ', href: '/dashboard/audit', icon: FileSearch },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  /* Prevent Hydration Mismatch: Wait for mount before checking admin status */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNavigation = navigation.filter((item) => {
    // Optimization: During SSR/Hydration, effectively skip admin check or default to false to match server
    if (!mounted) {
      // Server renders all public items. If item is adminOnly, exclude it on server.
      // Client must match this initial render.
      return !item.adminOnly;
    }

    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Image
                src="/gongtham_logo_65px.png"
                alt="Gongtham Logo"
                width={65}
                height={65}
              />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-accent rounded-md"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
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
                  {Icon && <Icon className="h-5 w-5" />}
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
