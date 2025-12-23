'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/gongtham_logo_108px.png"
            alt="Gongtham Logo"
            width={108}
            height={108}
            className="mb-4"
          />
          <h1 className="mb-2 text-3xl font-bold">ระบบตรวจใบตอบวิชาปรนัย</h1>
          <h2 className="mb-2 text-xl font-bold">สำนักงานแม่กองธรรมสนามหลวง</h2>
        </div>
      </div>
    </div>
  );
}
