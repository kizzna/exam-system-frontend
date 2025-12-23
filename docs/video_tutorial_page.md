# video tutorial page

Step-by-step implementation guide.

## Architecture Overview
User requests a video via Next.js URL (e.g., /api/video/tutorial.mp4).
Next.js checks if the user is logged in.
Next.js sends a special response header (X-Accel-Redirect) to Nginx pointing to the internal file path.
Nginx (Layer 2) catches this header, locates the file on CephFS, and streams it to the user.
User watches the video. The video location is never exposed publicly.

## Nginx Layer 2 Configuration Update
You need to modify your Layer 2 Nginx config to read the CephFS files.
Prerequisites: Ensure the CephFS shared storage is mounted on the server running the Layer 2 Nginx (or mounted as a volume if running in Docker) at a known path, e.g., /mnt/cephfs/tutorials.
Add this block inside the server { ... } block of your Layer 2 config, preferably before the location / block.
code
Nginx
# --- INTERNAL VIDEO STREAMING ---
    # This location is NOT accessible directly by the browser.
    # It can only be reached via internal redirect from Next.js
    location /protected_videos/ {
        internal;
        alias /mnt/cephfs/tutorials/; # <--- UPDATE THIS to your actual CephFS mount path

        # Optimization for video delivery
        aio threads;           # Use asynchronous I/O if available
        directio 512;          # Optimization for large files
        output_buffers 1 2M;   # Optimize buffer for streaming
        sendfile on;           # Zero-copy file transfer
        sendfile_max_chunk 512k;

        # Allow video seeking
        add_header Accept-Ranges bytes; 
        
        # Don't cache video files in Nginx proxy cache (too large)
        proxy_max_temp_file_size 0;
    }
Note on your existing config:
Your Layer 2 config already has good timeouts (proxy_read_timeout 3600s), so long videos won't timeout during playback.
NOTE: Finished.

## Next.js API Implementation
Create a new API route. Since you are using Next.js LTS, I will provide the example for the App Router (Next.js 13+), but the logic applies to Pages Router as well.
Path: src/app/api/video/[filename]/route.ts
TypeScript
import { NextRequest, NextResponse } from 'next/server';
// Import your auth method (e.g., NextAuth, custom session check)
// import { auth } from "@/auth"; 

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  // 1. SECURITY CHECK
  // Replace this with your actual authentication logic
  const session = true; // await auth(); 
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filename = params.filename;

  // 2. SANITIZATION (Crucial)
  // Prevent directory traversal attacks (e.g., "../../etc/passwd")
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  // 3. CONSTRUCT HEADERS
  // We return an empty body. Nginx will replace it with the file content.
  const headers = new Headers();
  
  // The path here must match the 'location' block in Nginx, NOT the file system path
  // Nginx: location /protected_videos/ -> alias /mnt/cephfs/tutorials/
  headers.set('X-Accel-Redirect', `/protected_videos/${filename}`);
  
  // Explicitly set Content-Type if known, or let Nginx guess it
  headers.set('Content-Type', 'video/mp4');

  return new NextResponse(null, {
    headers: headers,
  });
}

## React Frontend Component
Create a page to list and play videos.
Path: src/app/tutorials/page.tsx
code
Tsx
'use client';

import { useState } from 'react';

// Hardcoded list or fetch from database
const videos = [
  { id: 'scan-process.mp4', title: 'How to scan OMR sheets' },
  { id: 'error-handling.mp4', title: 'Handling double-marking errors' },
];

export default function TutorialPage() {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Evaluation Center Tutorials</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
          {currentVideo ? (
            <video 
              controls 
              autoPlay 
              className="w-full h-full"
              controlsList="nodownload" // Optional: makes it harder to download
              src={`/api/video/${currentVideo}`} 
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a video to start watching
            </div>
          )}
        </div>

        {/* Video List Section */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="font-semibold mb-4 text-gray-700">Available Videos</h2>
          <ul className="space-y-2">
            {videos.map((vid) => (
              <li 
                key={vid.id}
                onClick={() => setCurrentVideo(vid.id)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  currentVideo === vid.id 
                    ? 'bg-blue-100 border-blue-500 border' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">▶</span>
                  {vid.title}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

## Layout and menu location:
Menu location:
- Label: "วิธีตรวจใบตอบปรนัย" (icon: help icon)
- after last menu item "ประวัติการตรวจ"