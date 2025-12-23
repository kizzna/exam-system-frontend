
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> } // Params is a Promise in Next.js 15+
) {
    // 1. SECURITY CHECK
    const authStorage = request.cookies.get('auth-storage');
    let isAuthenticated = false;

    if (authStorage) {
        try {
            const cookieValue = decodeURIComponent(authStorage.value);
            const authData = JSON.parse(cookieValue);
            isAuthenticated = !!authData?.state?.accessToken;
        } catch {
            isAuthenticated = false;
        }
    }

    if (!isAuthenticated) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { filename } = await params;

    // 2. SANITIZATION (Crucial)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new NextResponse('Invalid filename', { status: 400 });
    }

    // 3. CONSTRUCT HEADERS
    const headers = new Headers();

    // The path here must match the 'location' block in Nginx (alias /cephfs/omr/tutorials/)
    headers.set('X-Accel-Redirect', `/protected_videos/${filename}`);

    headers.set('Content-Type', 'video/mp4');

    return new NextResponse(null, {
        headers: headers,
    });
}
