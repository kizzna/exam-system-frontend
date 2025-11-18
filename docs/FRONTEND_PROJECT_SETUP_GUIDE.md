# OMR Exam System - Frontend Project Setup Guide

**Project Name:** `exam-system-frontend`  
**Framework:** Next.js 15 LTS (App Router)  
**Date:** November 18, 2025  
**Status:** Initial Setup Guide

---

## Overview

This guide provides comprehensive instructions for setting up a **domain-driven, phase-aligned frontend project** that integrates with the OMR Exam System backend. The frontend architecture mirrors the backend's modular structure, enabling parallel development across 7 phases.

---

## Architecture Alignment

### Backend ↔ Frontend Mapping

| Backend Phase | Frontend Phase | Deliverables |
|---------------|----------------|--------------|
| Phase 1: Auth & Users | Phase 1: Auth & User Management UI | Login, user CRUD, role management |
| Phase 2: Batches | Phase 2: Batch Upload UI | File upload, strategy selection, progress |
| Phase 3: Tasks | Phase 3: Task Management UI | Task list, assignment, distribution |
| Phase 4: Sheets Review | Phase 4: Review Interface | Spreadsheet view, corrections, overlay |
| Phase 5: Grading & Exports | Phase 5: Grading & Export UI | Answer keys, export formats |
| Phase 6: Students & Audit | Phase 6: Search & Audit UI | Student search, audit logs |
| Phase 7: Hierarchy | Phase 7: Hierarchy Management | Org structure, RBAC |

---

## Technology Stack

### Core Framework
- **Next.js 15 LTS** - React framework with App Router
- **React 18/19** - UI library
- **TypeScript 5.x** - Type safety
- **Node.js 20 LTS** - Runtime

### UI & Styling
- **Tailwind CSS 3.x** - Utility-first CSS
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **Lucide React** - Icon library
- **Framer Motion** - Animations

### State Management
- **React Query (TanStack Query) v5** - Server state management
- **Zustand** - Client state management (auth, UI state)
- **React Hook Form** - Form state

### Data Fetching & Validation
- **Axios** - HTTP client with interceptors
- **Zod** - Runtime validation
- **TypeScript** - Compile-time validation

### Development Tools
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### DevOps
- **Docker** - Containerization
- **Dev Containers** - VS Code development environment
- **GitHub Actions** - CI/CD (optional)

---

## Project Structure (Domain-Driven)

```
frontend/
├── .devcontainer/
│   ├── devcontainer.json          # Dev container configuration
│   ├── Dockerfile                 # Development image
│   └── docker-compose.yml         # Services (frontend + optional backend)
│
├── app/                           # Next.js 15 App Router
│   ├── (auth)/                    # Route group: Auth pages
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   └── layout.tsx             # Auth layout (centered, no nav)
│   │
│   ├── (dashboard)/               # Route group: Authenticated pages
│   │   ├── layout.tsx             # Dashboard layout (sidebar, header)
│   │   ├── page.tsx               # Dashboard home
│   │   │
│   │   ├── users/                 # Phase 1: User Management
│   │   │   ├── page.tsx           # User list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # User details/edit
│   │   │   │   └── roles/
│   │   │   │       └── page.tsx   # User role management
│   │   │   └── new/
│   │   │       └── page.tsx       # Create user
│   │   │
│   │   ├── batches/               # Phase 2: Batch Upload
│   │   │   ├── page.tsx           # Batch list
│   │   │   ├── upload/
│   │   │   │   └── page.tsx       # Upload wizard
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Batch details
│   │   │
│   │   ├── tasks/                 # Phase 3: Task Management
│   │   │   ├── page.tsx           # Task list/dashboard
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # Task details
│   │   │   │   └── assign/
│   │   │   │       └── page.tsx   # Task assignment
│   │   │   └── distribute/
│   │   │       └── page.tsx       # Fair distribution tool
│   │   │
│   │   ├── review/                # Phase 4: Sheet Review
│   │   │   ├── page.tsx           # Review queue (spreadsheet)
│   │   │   ├── [sheetId]/
│   │   │   │   ├── page.tsx       # Sheet details with overlay
│   │   │   │   └── correct/
│   │   │   │       └── page.tsx   # Correction interface
│   │   │   └── bulk/
│   │   │       └── page.tsx       # Bulk operations
│   │   │
│   │   ├── grading/               # Phase 5: Grading & Exports
│   │   │   ├── answer-keys/
│   │   │   │   ├── page.tsx       # Answer key list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx   # Edit answer key
│   │   │   │   └── new/
│   │   │   │       └── page.tsx   # Create answer key
│   │   │   └── exports/
│   │   │       ├── page.tsx       # Export manager
│   │   │       └── [id]/
│   │   │           └── page.tsx   # Export details
│   │   │
│   │   ├── students/              # Phase 6: Student Search
│   │   │   ├── page.tsx           # Search interface
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Student details
│   │   │
│   │   └── audit/                 # Phase 6: Audit Logs
│   │       └── page.tsx           # Audit log viewer
│   │
│   ├── api/                       # API routes (optional proxy)
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       # NextAuth.js (optional)
│   │
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles
│   └── error.tsx                  # Global error boundary
│
├── components/                    # Reusable components (domain-aligned)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PermissionGate.tsx
│   │
│   ├── users/
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   ├── UserCard.tsx
│   │   └── RoleSelector.tsx
│   │
│   ├── batches/
│   │   ├── BatchUploadWizard.tsx
│   │   ├── UploadStrategySelector.tsx
│   │   ├── FileDropzone.tsx
│   │   └── BatchStatusBadge.tsx
│   │
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskFilter.tsx
│   │   ├── AssignmentModal.tsx
│   │   └── DistributionTool.tsx
│   │
│   ├── sheets/
│   │   ├── ReviewQueue.tsx           # Spreadsheet-like view
│   │   ├── SheetViewer.tsx           # Image viewer with overlay
│   │   ├── BubbleOverlay.tsx
│   │   ├── CorrectionForm.tsx
│   │   ├── BulkEditModal.tsx
│   │   └── RereadDialog.tsx
│   │
│   ├── grading/
│   │   ├── AnswerKeyForm.tsx
│   │   ├── AnswerKeyList.tsx
│   │   └── GradingProgress.tsx
│   │
│   ├── exports/
│   │   ├── ExportForm.tsx
│   │   ├── ExportList.tsx
│   │   └── DownloadButton.tsx
│   │
│   ├── students/
│   │   ├── StudentSearch.tsx
│   │   ├── StudentCard.tsx
│   │   └── SearchFilters.tsx
│   │
│   ├── audit/
│   │   ├── AuditLogTable.tsx
│   │   └── AuditFilters.tsx
│   │
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── toast.tsx
│       └── ...
│
├── lib/                           # Core utilities & services
│   ├── api/
│   │   ├── client.ts              # Axios instance with interceptors
│   │   ├── auth.ts                # Auth API calls
│   │   ├── users.ts               # Users API calls
│   │   ├── batches.ts             # Batches API calls
│   │   ├── tasks.ts               # Tasks API calls
│   │   ├── sheets.ts              # Sheets API calls
│   │   ├── grading.ts             # Grading API calls
│   │   ├── exports.ts             # Exports API calls
│   │   ├── students.ts            # Students API calls
│   │   └── audit.ts               # Audit API calls
│   │
│   ├── hooks/                     # Custom React hooks (domain-aligned)
│   │   ├── auth/
│   │   │   ├── useAuth.ts
│   │   │   ├── useLogin.ts
│   │   │   └── usePermissions.ts
│   │   ├── users/
│   │   │   ├── useUsers.ts
│   │   │   ├── useUser.ts
│   │   │   └── useUserRoles.ts
│   │   ├── batches/
│   │   │   ├── useBatches.ts
│   │   │   ├── useBatchUpload.ts
│   │   │   └── useBatchStatus.ts
│   │   ├── tasks/
│   │   │   ├── useTasks.ts
│   │   │   ├── useTask.ts
│   │   │   └── useTaskAssignment.ts
│   │   ├── sheets/
│   │   │   ├── useReviewQueue.ts
│   │   │   ├── useSheet.ts
│   │   │   └── useBulkUpdate.ts
│   │   ├── grading/
│   │   │   ├── useAnswerKeys.ts
│   │   │   └── useGrading.ts
│   │   ├── exports/
│   │   │   └── useExports.ts
│   │   ├── students/
│   │   │   └── useStudentSearch.ts
│   │   └── audit/
│   │       └── useAuditLogs.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── auth-store.ts          # Auth state (user, tokens)
│   │   ├── ui-store.ts            # UI state (sidebar, theme)
│   │   └── upload-store.ts        # Upload progress state
│   │
│   ├── types/                     # TypeScript types (mirrors backend)
│   │   ├── api.ts                 # Common API types
│   │   ├── auth.ts                # Auth types
│   │   ├── users.ts               # User types
│   │   ├── batches.ts             # Batch types
│   │   ├── tasks.ts               # Task types
│   │   ├── sheets.ts              # Sheet types
│   │   ├── grading.ts             # Grading types
│   │   ├── exports.ts             # Export types
│   │   ├── students.ts            # Student types
│   │   └── audit.ts               # Audit types
│   │
│   ├── utils/
│   │   ├── cn.ts                  # Tailwind class merger
│   │   ├── format.ts              # Date/time formatting
│   │   ├── validation.ts          # Client-side validation
│   │   └── constants.ts           # App constants
│   │
│   └── providers/
│       ├── query-provider.tsx     # React Query provider
│       ├── auth-provider.tsx      # Auth context provider
│       └── theme-provider.tsx     # Theme provider
│
├── middleware.ts                  # Next.js middleware (route protection)
│
├── docs/                          # Phase-based documentation
│   ├── PHASE1_IMPLEMENTATION.md   # Phase 1 completion notes
│   ├── PHASE2_IMPLEMENTATION.md
│   ├── PHASE3_IMPLEMENTATION.md
│   ├── PHASE4_IMPLEMENTATION.md
│   ├── PHASE5_IMPLEMENTATION.md
│   ├── PHASE6_IMPLEMENTATION.md
│   └── PHASE7_IMPLEMENTATION.md
│
├── public/                        # Static assets
│   ├── images/
│   └── icons/
│
├── tests/                         # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local.example             # Environment variables template
├── .env.local                     # Local environment (gitignored)
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── next.config.mjs                # Next.js config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── README.md                      # Project overview
```

---

## Dev Container Configuration

### `.devcontainer/devcontainer.json`

```json
{
  "name": "Exam System Frontend - Next.js 15",
  "dockerComposeFile": "docker-compose.yml",
  "service": "frontend",
  "workspaceFolder": "/workspace",
  
  "mounts": [
    "source=/mnt/cephfs/exam-system,target=/mnt/cephfs/exam-system,type=bind"
  ],
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "usernamehw.errorlens",
        "streetsidesoftware.code-spell-checker",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "Prisma.prisma"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true
        },
        "typescript.tsdk": "node_modules/typescript/lib",
        "tailwindCSS.experimental.classRegex": [
          ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
        ]
      }
    }
  },
  
  "forwardPorts": [3000, 8000],
  "portsAttributes": {
    "3000": {
      "label": "Next.js Dev Server",
      "onAutoForward": "notify"
    },
    "8000": {
      "label": "Backend API",
      "onAutoForward": "silent"
    }
  },
  
  "postCreateCommand": "pnpm install",
  "postStartCommand": "pnpm dev",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/git:1": {}
  },
  
  "remoteUser": "node"
}
```

### `.devcontainer/Dockerfile`

```dockerfile
FROM node:20-alpine

# Install pnpm (faster than npm)
RUN npm install -g pnpm

# Install development tools
RUN apk add --no-cache git curl

# Set working directory
WORKDIR /workspace

# Expose Next.js dev server port
EXPOSE 3000

# Default command (will be overridden by devcontainer.json)
CMD ["pnpm", "dev"]
```

### `.devcontainer/docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ../:/workspace:cached
    command: sleep infinity
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://backend:8000
    ports:
      - "3000:3000"
    networks:
      - omr-network

  # Optional: Backend service for local development
  backend:
    image: omr-backend:latest  # Adjust to your backend image
    environment:
      - DATABASE_HOST=db
      - DATABASE_PORT=3306
    ports:
      - "8000:8000"
    networks:
      - omr-network
    # Uncomment if you want backend running locally
    # profiles:
    #   - with-backend

networks:
  omr-network:
    driver: bridge
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "exam-system-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "prepare": "husky install"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.56.0",
    "axios": "^1.7.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "lucide-react": "^0.446.0",
    "framer-motion": "^11.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.47.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `.env.local.example`

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication (if using NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

---

## Phase-Based Implementation Plan

### Phase 1: Authentication & User Management (Weeks 1-2)

**Deliverables:**
1. ✅ Auth system (login, logout, token management)
2. ✅ Protected routes middleware
3. ✅ User list with pagination
4. ✅ User CRUD forms
5. ✅ Role assignment UI

**Components to Build:**
- `components/auth/LoginForm.tsx`
- `components/auth/ProtectedRoute.tsx`
- `components/users/UserList.tsx`
- `components/users/UserForm.tsx`
- `components/users/RoleSelector.tsx`

**API Integration:**
- `lib/api/auth.ts` - Login, logout, refresh, me
- `lib/api/users.ts` - User CRUD, roles

**Hooks:**
- `lib/hooks/auth/useAuth.ts`
- `lib/hooks/auth/useLogin.ts`
- `lib/hooks/users/useUsers.ts`
- `lib/hooks/users/useUser.ts`

**Documentation:**
- Create `docs/PHASE1_IMPLEMENTATION.md` at completion

---

### Phase 2: Batch Upload Interface (Weeks 3-4)

**Deliverables:**
1. ✅ File upload wizard with drag-and-drop
2. ✅ Upload strategy selection
3. ✅ Real-time progress tracking
4. ✅ Batch list and status monitoring

**Components:**
- `components/batches/BatchUploadWizard.tsx`
- `components/batches/FileDropzone.tsx`
- `components/batches/UploadStrategySelector.tsx`
- `components/batches/BatchStatusBadge.tsx`

**Advanced Features:**
- Chunked file upload (10MB chunks)
- Upload queue management
- SSE/WebSocket for real-time status

---

### Phase 3: Task Management (Weeks 5-7)

**Deliverables:**
1. ✅ Task list with advanced filtering
2. ✅ Task assignment modal
3. ✅ Fair distribution tool
4. ✅ Task workflow visualization

**Components:**
- `components/tasks/TaskList.tsx`
- `components/tasks/TaskFilter.tsx`
- `components/tasks/AssignmentModal.tsx`
- `components/tasks/DistributionTool.tsx`

---

### Phase 4: Sheet Review Interface (Weeks 8-12)

**Deliverables:**
1. ✅ Spreadsheet-like review queue
2. ✅ Image viewer with bubble overlay
3. ✅ Correction forms (manual, QR-based, answer)
4. ✅ Bulk operations interface
5. ✅ Re-read workflow

**Components:**
- `components/sheets/ReviewQueue.tsx` (spreadsheet view)
- `components/sheets/SheetViewer.tsx` (image + overlay)
- `components/sheets/BubbleOverlay.tsx`
- `components/sheets/CorrectionForm.tsx`
- `components/sheets/BulkEditModal.tsx`
- `components/sheets/RereadDialog.tsx`

**Key Libraries:**
- **TanStack Table** for spreadsheet view
- **React Image Annotate** for bubble overlay
- **Canvas API** for drawing coordinates

---

### Phase 5: Grading & Exports (Weeks 13-14)

**Deliverables:**
1. ✅ Answer key management (admin)
2. ✅ Grading trigger UI
3. ✅ Export format selection
4. ✅ Download manager

---

### Phase 6: Search & Audit (Weeks 15-16)

**Deliverables:**
1. ✅ Student search with autocomplete
2. ✅ Advanced filtering
3. ✅ Audit log viewer

---

### Phase 7: Hierarchy Management (Weeks 17-20)

**Deliverables:**
1. ✅ Organizational hierarchy tree
2. ✅ Hierarchy-based permissions UI
3. ✅ Admin hierarchy management

---

## Development Workflow

### 1. Start Dev Container

```bash
# In VS Code
Cmd/Ctrl + Shift + P → "Dev Containers: Reopen in Container"
```

### 2. Daily Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

### 3. Before Committing

```bash
# Husky will automatically run:
# - ESLint
# - Prettier
# - Type checking
git add .
git commit -m "feat: implement user list component"
```

### 4. End of Phase

```bash
# Create phase documentation
touch docs/PHASE{N}_IMPLEMENTATION.md

# Document what was built, challenges, solutions
# Update README.md with progress
```

---

## API Client Setup

### `lib/api/client.ts`

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        useAuthStore.getState().setTokens(access_token, refresh_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Authentication Store (Zustand)

### `lib/stores/auth-store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role_hierarchy: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      
      setUser: (user) => set({ user }),
      
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
      
      get isAuthenticated() {
        return !!get().user && !!get().accessToken;
      },
      
      get isAdmin() {
        return get().user?.is_admin ?? false;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

---

## React Query Setup

### `lib/providers/query-provider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Middleware (Route Protection)

### `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/users') ||
      request.nextUrl.pathname.startsWith('/batches') ||
      request.nextUrl.pathname.startsWith('/tasks')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (request.nextUrl.pathname === '/login' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/batches/:path*', '/tasks/:path*', '/login'],
};
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// components/users/UserList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';

describe('UserList', () => {
  it('renders user list', () => {
    render(<UserList />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Handoff Process (End of Each Phase)

### 1. Backend Team Completes Phase
- All endpoints tested
- `PHASE{N}_FRONTEND_GUIDE.md` generated

### 2. Handoff Meeting
- Review API specifications
- Discuss edge cases
- Clarify UI/UX requirements

### 3. Frontend Team Implements
- Follow `PHASE{N}_FRONTEND_GUIDE.md`
- Build components listed in this guide
- Use provided TypeScript types

### 4. Integration Testing
- Test against production backend
- Verify all endpoints
- Document issues

### 5. Phase Completion
- Create `docs/PHASE{N}_IMPLEMENTATION.md`
- Update README.md progress
- Tag release (e.g., `v0.1.0-phase1`)

---

## CI/CD (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build
```

---

## Troubleshooting

### Common Issues

**1. API CORS errors**
```typescript
// Backend: Enable CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Token refresh loop**
- Check interceptor logic
- Verify refresh endpoint
- Clear localStorage/cookies

**3. Dev container slow**
- Use volume mounts correctly
- Exclude `node_modules` from sync
- Increase Docker resources

---

## Next Steps

1. **Review this guide** with the team
2. **Set up dev container** using the configuration above
3. **Initialize Next.js project** with the structure
4. **Install dependencies** from `package.json`
5. **Wait for backend Phase 1 completion** to receive `PHASE1_FRONTEND_GUIDE.md`
6. **Start Phase 1 frontend development**

---

## Production Deployment (CephFS)

### CephFS Structure

```
/cephfs/exam-system/
└── frontend/
    ├── current -> releases/dev-20251118_143022
    ├── releases/
    │   └── dev-20251118_143022/
    │       ├── .next/
    │       ├── app/
    │       ├── components/
    │       └── ...
    └── shared/
        ├── uploads/
        ├── cache/
        └── logs/
```

### Deployment Workflow

1. **Development** (Dev Container):
   ```bash
   # Make changes
   vim app/dashboard/page.tsx
   
   # Test locally
   pnpm dev
   ```

2. **Sync to CephFS**:
   ```bash
   # Option A: Quick sync (no build)
   ./scripts/dev-sync-frontend.sh
   
   # Option B: Production deploy (with build)
   ./scripts/dev-sync-frontend.sh --build
   
   # Option C: Dry run
   ./scripts/dev-sync-frontend.sh --dry-run
   ```

3. **Deploy on gt-omr-web-1**:
   ```bash
   ssh gt-omr-web-1
   cd /cephfs/exam-system/frontend/current
   pm2 restart exam-system-frontend
   
   # Verify
   curl http://localhost:3000
   pm2 logs exam-system-frontend
   ```

### PM2 Ecosystem Config

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'exam-system-frontend',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/cephfs/exam-system/frontend/current',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://10.10.24.131:8000'
    }
  }]
};
```

### Nginx Reverse Proxy

```nginx
upstream nextjs_backend {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name omr.example.com;
    
    location /_next/static/ {
        alias /cephfs/exam-system/frontend/current/.next/static/;
        expires 1y;
    }
    
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Rollback

```bash
# Quick rollback to previous release
cd /cephfs/exam-system/frontend
ln -sfn releases/dev-20251117_180000 current
pm2 restart exam-system-frontend
```

**📖 For detailed deployment guide, see:** `CEPHFS_DEPLOYMENT_STRATEGY.md`

---

## Resources

- **Backend API Docs:** http://gt-omr-api-1:8000/docs
- **Backend Guide:** `/workspaces/omr-backend/EXAM_SYSTEM_REFACTORING_GUIDE.md`
- **Phase 1 Frontend Guide:** `PHASE1_FRONTEND_GUIDE.md` ✅
- **Deployment Guide:** `CEPHFS_DEPLOYMENT_STRATEGY.md` ✅
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com
- **React Query:** https://tanstack.com/query/latest

---

**Ready to Build!** 🚀
