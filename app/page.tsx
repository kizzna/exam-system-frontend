import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/gongtham_logo_108px.png"
            alt="Gongtham Logo"
            width={108}
            height={108}
            className="mb-4"
          />
          <h1 className="mb-2 text-3xl font-bold">ระบบตรวจใบตอบปรนัย</h1>
          <h2 className="mb-2 text-xl font-bold">สำนักงานแม่กองธรรมสนามหลวง</h2>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
