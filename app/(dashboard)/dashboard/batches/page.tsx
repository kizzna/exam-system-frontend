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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Batches</h1>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">รายการที่อัปโหลดแล้ว</TabsTrigger>
          <TabsTrigger value="upload">อัปโหลดใบคำตอบ</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BatchList isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="upload">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">อัปโหลดใบคำตอบ</h2>
              <BatchUploadForm />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>คำแนะนำในการอัปโหลด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>ไฟล์ ZIP ที่มีใบนำสแกน QR Code:</strong> ส่วนมากสำนักเรียนละ 1 ไฟล์
                  </p>
                  <p>
                    <strong>ไฟล์รูปภาพ:</strong> อัปโหลดรูปภาพที่ต้องการอัปโหลด
                  </p>
                  <div className="rounded-md bg-muted p-4">
                    <p className="font-medium text-foreground">ข้อกำหนดไฟล์:</p>
                    <ul className="ml-4 list-disc space-y-1 mt-2">
                      <li>ไฟล์ ZIP ขนาดไม่เกิน 10GB</li>
                      <li>รูปภาพในรูปแบบ JPG</li>
                      <li>สแกนที่ความละเอียด 200 DPI A4 แนวตั้ง Grayscale</li>
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
