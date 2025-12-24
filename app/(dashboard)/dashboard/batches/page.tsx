'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { BatchList } from '@/components/batches/BatchList';
import { BatchUploadForm } from '@/components/batches/BatchUploadForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BatchesPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-3xl text-primary items-center font-bold">อัปโหลดใบตอบ</h1>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">รายการที่อัปโหลดแล้ว</TabsTrigger>
          <TabsTrigger value="upload">อัปโหลดใบตอบ</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BatchList isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="upload">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <BatchUploadForm />
            </div>
            <div>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-primary text-center">คำแนะนำในการอัปโหลด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-lg text-muted-foreground">
                  <div className="rounded-md bg-muted p-4">
                    <ul className="ml-4 list-disc space-y-1 mt-2">
                      <li className="text-red-500">ห้ามมี Folder มากกว่า 1 folder ใน 1 ZIP (ถ้ามีจะอัปโหลดไม่ผ่าน)</li>
                      <li className="text-red-500">ใบนำสแกนห้ามเล็กกว่า 140 KB และ ห้ามเกิน 320KB</li>
                      <li className="text-red-500">ใบตอบห้ามเล็กกว่า 500 KB และ ห้ามเกิน 1000 KB</li>
                      <li className="text-red-500">แต่ละไฟล์จะต้องเริ่มต้นด้วย<span className="font-bold">ใบนำสแกน </span>และไฟล์สุดท้าย จะต้องเสร็จสนามสอบนั้น ๆ</li>
                      <li className="text-red-500">ไฟล์ ZIP ขนาดไม่เกิน 2-3 GB ต่อ 1 ไฟล์</li>
                      <li>อัปโหลดได้ทีละหลายไฟล์</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
