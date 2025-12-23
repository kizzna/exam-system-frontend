// App constants
export const APP_NAME = 'ระบบตรวจใบตอบวิชาปรนัย';
// Use relative path on client to leverage Next.js proxy (avoids CORS & Mixed Content)
// Use internal docker URL on server side
export const API_BASE_URL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1.gt:8000');

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Token expiration times
export const ACCESS_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Upload configuration
export const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// Routes
export const PUBLIC_ROUTES = ['/login', '/'];
export const AUTH_ROUTES = ['/login'];
export const PROTECTED_ROUTES = ['/dashboard'];
