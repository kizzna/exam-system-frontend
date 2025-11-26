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
          <TabsTrigger value="list">Batch List</TabsTrigger>
          <TabsTrigger value="upload">Upload Batch</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BatchList isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="upload">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">New Batch Upload</h2>
              <BatchUploadForm />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Upload Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>ZIP with QR Codes:</strong> Use this for standard processing. The system
                    will extract the Task ID from the QR code on each sheet.
                  </p>
                  <p>
                    <strong>ZIP without QR Codes:</strong> Use this when sheets don't have QR codes.
                    You must manually specify the Task ID.
                  </p>
                  <p>
                    <strong>Direct Images:</strong> Upload individual image files directly. Useful
                    for small batches or testing.
                  </p>
                  <div className="rounded-md bg-muted p-4">
                    <p className="font-medium text-foreground">File Requirements:</p>
                    <ul className="ml-4 list-disc space-y-1 mt-2">
                      <li>ZIP files up to 10GB</li>
                      <li>Images in JPG or PNG format</li>
                      <li>Scans should be at least 300 DPI</li>
                      <li>Ensure all 4 corner markers are visible</li>
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
