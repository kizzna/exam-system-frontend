
---

## Prompt for AI Agent

```
I need you to create a complete Next.js 15 dev container project for an Exam Management System frontend. This project will integrate with a FastAPI backend that follows domain-driven architecture and will be developed across 7 phases.

## Project Requirements

### Core Technology Stack

#### Framework & Runtime
- **Framework:** Next.js 15 LTS with App Router
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 20 LTS
- **Package Manager:** pnpm

#### UI & Styling
- **UI Library:** shadcn/ui (Tailwind CSS + Radix UI)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Additional UI Libraries:** TanStack Table (for spreadsheet views), React Image Annotate (for bubble overlay)

#### State Management & Data Fetching
- **Server State:** React Query v5 (TanStack Query)
- **Client State:** Zustand with persist middleware
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios with interceptors for token refresh

#### Development Tools
- **Dev Environment:** VS Code Dev Containers
- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier with Tailwind plugin
- **Git Hooks:** Husky + lint-staged
- **Testing:** Vitest (unit) + Playwright (E2E)

#### Additional Libraries
- **Date/Time:** date-fns
- **Class Utilities:** class-variance-authority, clsx, tailwind-merge
- **Validation:** Zod with @hookform/resolvers
- **Radix UI Components:** dialog, dropdown-menu, select, toast, and more

### Phase-Based Development Approach

This project follows a 7-phase development approach that aligns with backend development:

**Phase 1: Authentication & User Management (Weeks 1-2)**
- Login/logout functionality
- Protected routes middleware
- User list with pagination
- User CRUD forms
- Role assignment UI

**Phase 2: Batch Upload Interface (Weeks 3-4)**
- File upload wizard with drag-and-drop
- Upload strategy selection
- Real-time progress tracking
- Batch list and status monitoring
- Chunked file upload (10MB chunks)
- Upload queue management
- SSE/WebSocket for real-time status

**Phase 3: Task Management (Weeks 5-7)**
- Task list with advanced filtering
- Task assignment modal
- Fair distribution tool
- Task workflow visualization

**Phase 4: Sheet Review Interface (Weeks 8-12)**
- Spreadsheet-like review queue
- Image viewer with bubble overlay
- Correction forms (manual, QR-based, answer)
- Bulk operations interface
- Re-read workflow

**Phase 5: Grading & Exports (Weeks 13-14)**
- Answer key management (admin)
- Grading trigger UI
- Export format selection
- Download manager

**Phase 6: Search & Audit (Weeks 15-16)**
- Student search with autocomplete
- Advanced filtering
- Audit log viewer

**Phase 7: Hierarchy Management (Weeks 17-20)**
- Organizational hierarchy tree
- Hierarchy-based permissions UI
- Admin hierarchy management

### Project Structure (Domain-Driven with Detailed Nested Routes)

Create this exact folder structure:

```
exam-system-frontend/
├── .devcontainer/
│   ├── devcontainer.json          # VS Code dev container config
│   ├── Dockerfile                 # Node 20 Alpine image
│   └── docker-compose.yml         # Frontend service + optional backend

├── app/                           # Next.js App Router
│   ├── (auth)/                    # Route group: Public auth pages
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

├── middleware.ts                  # Next.js middleware (route protection)

├── docs/                          # Phase-based documentation
│   ├── PHASE1_IMPLEMENTATION.md   # Phase 1 completion notes
│   ├── PHASE2_IMPLEMENTATION.md
│   ├── PHASE3_IMPLEMENTATION.md
│   ├── PHASE4_IMPLEMENTATION.md
│   ├── PHASE5_IMPLEMENTATION.md
│   ├── PHASE6_IMPLEMENTATION.md
│   └── PHASE7_IMPLEMENTATION.md

├── public/                        # Static assets
│   ├── images/
│   └── icons/

├── tests/                         # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/

├── .env.local.example             # Environment variables template
├── .env.local                     # Local environment (gitignored)
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── next.config.mjs                # Next.js config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── ecosystem.config.js            # PM2 ecosystem config
└── README.md                      # Project overview
```

### Dev Container Configuration

**.devcontainer/devcontainer.json:**
```json
{
  "name": "Exam System Frontend - Next.js 15",
  "dockerComposeFile": "docker-compose.yml",
  "service": "frontend",
  "workspaceFolder": "/workspace",
  
  "mounts": [
    "source=/mnt/cephfs/exam-system,target=/cephfs/exam-system,type=bind"
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

**.devcontainer/Dockerfile:**
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

**.devcontainer/docker-compose.yml:**
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

### Package.json Dependencies

**Production:**
- next@^15.0.0
- react@^18.3.0
- react-dom@^18.3.0
- @tanstack/react-query@^5.56.0
- axios@^1.7.0
- zustand@^4.5.0
- react-hook-form@^7.53.0
- zod@^3.23.0
- @hookform/resolvers@^3.9.0
- tailwindcss@^3.4.0
- @radix-ui/react-dialog@^1.1.0
- @radix-ui/react-dropdown-menu@^2.1.0
- @radix-ui/react-select@^2.1.0
- @radix-ui/react-toast@^1.2.0
- lucide-react@^0.446.0
- framer-motion@^11.5.0
- class-variance-authority@^0.7.0
- clsx@^2.1.0
- tailwind-merge@^2.5.0
- date-fns@^3.6.0
- @tanstack/react-table
- react-image-annotate

**Development:**
- typescript@^5.6.0
- @types/node@^22.5.0
- @types/react@^18.3.0
- @types/react-dom@^18.3.0
- eslint@^8.57.0
- eslint-config-next@^15.0.0
- prettier@^3.3.0
- prettier-plugin-tailwindcss@^0.6.0
- husky@^9.1.0
- lint-staged@^15.2.0
- vitest@^2.1.0
- @playwright/test@^1.47.0
- autoprefixer@^10.4.0
- postcss@^8.4.0

**Scripts:**
- "dev": "next dev"
- "build": "next build"
- "start": "next start"
- "lint": "next lint"
- "format": "prettier --write ."
- "type-check": "tsc --noEmit"
- "test": "vitest"
- "test:e2e": "playwright test"
- "prepare": "husky install"

### Initial File Implementations

**1. API Client (lib/api/client.ts):**
Create an Axios instance with:
- Base URL from environment variable
- Request interceptor to add Bearer token
- Response interceptor to handle 401 and refresh tokens
- Automatic retry on token refresh
- Redirect to login on refresh failure

**2. Auth Store (lib/stores/auth-store.ts):**
Zustand store with persist middleware:
- State: user, accessToken, refreshToken
- Actions: setTokens, setUser, logout
- Computed: isAuthenticated, isAdmin

**3. Query Provider (lib/providers/query-provider.tsx):**
React Query configuration:
- QueryClient with default options (1min staleTime)
- Include ReactQueryDevtools in development

**4. Middleware (middleware.ts):**
Route protection logic:
- Protect /dashboard/* routes (require auth)
- Redirect logged-in users away from /login
- Use Next.js middleware matcher

**5. Auth Types (lib/types/auth.ts):**
TypeScript interfaces for:
- LoginRequest, LoginResponse, TokenResponse
- User, UserInfo
- RefreshTokenRequest

**6. shadcn/ui Components:**
Install and configure these base components:
- button, input, label, form
- dialog, dropdown-menu, select
- table, toast, card
- Use `cn()` utility for class merging

**7. Root Layout (app/layout.tsx):**
- Include QueryProvider
- Include Toaster for notifications
- Set metadata (title, description)
- Import globals.css

**8. Login Page (app/(auth)/login/page.tsx):**
Basic login form with:
- Username and password inputs
- Form validation with React Hook Form + Zod
- Call /api/auth/login
- Store tokens in Zustand store
- Redirect to /dashboard on success

**9. Dashboard Layout (app/(dashboard)/layout.tsx):**
- Sidebar navigation (Users, Batches, Tasks, Review, Grading, etc.)
- Header with user menu
- Protected route wrapper
- Logout functionality

**10. Environment Variables (.env.local.example):**
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

### Development Workflow Instructions

**1. Start Dev Container:**
```bash
# In VS Code
Cmd/Ctrl + Shift + P → "Dev Containers: Reopen in Container"
```

**2. Daily Development:**
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

**3. Before Committing:**
```bash
# Husky will automatically run:
# - ESLint
# - Prettier
# - Type checking
git add .
git commit -m "feat: implement user list component"
```

**4. End of Phase:**
```bash
# Create phase documentation
touch docs/PHASE{N}_IMPLEMENTATION.md

# Document what was built, challenges, solutions
# Update README.md with progress
```

### Testing Configuration

**Unit Tests (Vitest):**
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

**E2E Tests (Playwright):**
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

### CI/CD Configuration

**GitHub Actions Example:**
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

### Deployment Information (CephFS, PM2, Nginx)

**CephFS Structure:**
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

**PM2 Ecosystem Config (ecosystem.config.js):**
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

**Nginx Reverse Proxy:**
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

### Troubleshooting Guide

**Common Issues:**

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

**4. Build failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

**5. Deployment issues**
- Verify CephFS permissions
- Check PM2 logs
- Validate Nginx configuration

### Security Considerations

**1. Authentication & Authorization:**
- Implement proper JWT token handling
- Secure token storage (httpOnly cookies or secure localStorage)
- Role-based access control (RBAC)
- Route protection at both client and server level

**2. Data Protection:**
- Sanitize all user inputs
- Validate data on both client and server
- Use HTTPS in production
- Implement proper error handling without exposing sensitive information

**3. Content Security Policy:**
- Implement CSP headers to prevent XSS attacks
- Use nonces for inline scripts
- Restrict resource loading to trusted domains

**4. Dependency Security:**
- Regularly update dependencies
- Use tools like `npm audit` or `pnpm audit`
- Check for known vulnerabilities in dependencies

### Additional Requirements

1. **ESLint Configuration:**
   - Extend next/core-web-vitals
   - Enable TypeScript strict mode
   - Custom rules for unused imports

2. **Prettier Configuration:**
   - 2-space indentation
   - Single quotes
   - Tailwind CSS plugin for class sorting

3. **Tailwind Configuration:**
   - Custom colors for primary, secondary, accent
   - Dark mode support (class strategy)
   - Custom spacing/sizing utilities

4. **TypeScript Configuration:**
   - Strict mode enabled
   - Path aliases: @/* for root, @/components/*, @/lib/*
   - Include app, components, lib folders

5. **Git Hooks (Husky + lint-staged):**
   - Pre-commit: Run ESLint, Prettier, type-check
   - Commit-msg: Enforce conventional commits (optional)

6. **Documentation:**
   - README.md with project overview, setup instructions, tech stack
   - docs/PHASE1_IMPLEMENTATION.md placeholder for Phase 1 completion notes

### Success Criteria

After setup, I should be able to:
1. Open project in VS Code and reopen in dev container
2. Container builds successfully with Node 20 + pnpm
3. Run `pnpm dev` and access http://localhost:3000
4. See a working login page at http://localhost:3000/login
5. TypeScript compilation works without errors
6. ESLint and Prettier are functional
7. All domain folders exist with placeholder files
8. shadcn/ui components are installed and working
9. Testing framework is configured and working
10. CI/CD pipeline is set up and functional
11. Deployment configuration is ready for CephFS

### Important Notes

- Use **pnpm** as package manager (faster than npm/yarn)
- Follow **domain-driven structure** exactly as specified
- Implement **token refresh** in Axios interceptor
- Use **Zustand with persist** for auth state
- Enable **React Query DevTools** in development
- Add **proper TypeScript types** for all API calls
- Use **shadcn/ui components** consistently
- Follow **Next.js 15 App Router** conventions
- Create **route groups** for (auth) and (dashboard)
- Set up **middleware** for route protection
- Implement **phase-based development** approach
- Configure **testing** with Vitest and Playwright
- Set up **CI/CD** with GitHub Actions
- Prepare for **deployment** on CephFS with PM2 and Nginx

## Additional Context

This frontend will integrate with a FastAPI backend (http://gt-omr-api-1:8000) that has these domains:
- Auth (login, refresh, verify)
- Users (CRUD, roles, permissions)
- Batches (upload workflows)
- Tasks (assignment, distribution)
- Sheets (review, corrections)
- Grading (answer keys, scoring)
- Exports (CSV, Excel)
- Students (search)
- Audit (logging)

The backend follows JWT authentication with 30-minute access tokens and 7-day refresh tokens.

## Output Format

Please:
1. **Create all necessary files** with complete implementations
2. **Generate package.json** with exact versions
3. **Set up dev container configuration**
4. **Implement API client with token refresh**
5. **Create auth store and providers**
6. **Build basic login page**
7. **Set up middleware for route protection**
8. **Configure ESLint, Prettier, TypeScript**
9. **Install shadcn/ui base components**
10. **Set up testing framework**
11. **Configure CI/CD pipeline**
12. **Create deployment configuration**
13. **Create README.md** with setup instructions
14. **Create phase documentation placeholders**

Start with the dev container setup, then package.json, then core infrastructure (API client, auth), then UI components, then testing and deployment configuration.

Thank you!
```

---

## Usage Instructions

### Option 1: GitHub Copilot Workspace

1. Create new repository: `exam-system-frontend`
2. Open in GitHub Codespaces or VS Code
3. Open Copilot Chat (Cmd/Ctrl + I)
4. Paste the prompt above
5. Review generated files and make adjustments
6. Test dev container setup

### Option 2: Cursor IDE

1. Create new folder: `exam-system-frontend`
2. Open in Cursor
3. Open Composer (Cmd/Ctrl + K)
4. Paste the prompt above
5. Cursor will generate all files
6. Review and test

### Option 3: CLI with AI Assistant

1. Create project folder:
   ```bash
   mkdir exam-system-frontend
   cd exam-system-frontend
   ```

2. Save prompt to file:
   ```bash
   cat > SETUP_PROMPT.md << 'EOF'
   [Paste the prompt above]
   EOF
   ```

3. Use with AI CLI tool:
   ```bash
   # Example with OpenAI CLI
   openai-cli --prompt "$(cat SETUP_PROMPT.md)"
   ```

---

## Post-Setup Verification

After AI generates the project, verify:

```bash
# 1. Open in VS Code
code exam-system-frontend

# 2. Reopen in dev container
# Cmd/Ctrl + Shift + P → "Dev Containers: Reopen in Container"

# 3. Wait for container build and dependency installation

# 4. Verify dev server
pnpm dev
# Should see: "Ready on http://localhost:3000"

# 5. Check type safety
pnpm type-check
# Should complete without errors

# 6. Test linting
pnpm lint
# Should pass

# 7. Run tests
pnpm test
# Should run unit tests

# 8. Run E2E tests
pnpm test:e2e
# Should run Playwright tests

# 9. Open browser
# http://localhost:3000/login
# Should see login page

# 10. Verify shadcn/ui
# Login page should have styled components
```

---

## Next Steps After Setup

1. **Wait for Backend Phase 1 Completion**
   - Backend team will provide `PHASE1_FRONTEND_GUIDE.md`
   - This guide contains exact API specs and TypeScript types

2. **Implement Phase 1 Features**
   - Login functionality
   - User list with pagination
   - User CRUD forms
   - Role assignment UI

3. **Integration Testing**
   - Test against production backend (http://gt-omr-api-1:8000)
   - Verify token refresh works
   - Test all CRUD operations

4. **Document Phase 1 Completion**
   - Create `docs/PHASE1_IMPLEMENTATION.md`
   - Note challenges and solutions
   - Update README.md progress

5. **Prepare for Deployment**
   - Test build process
   - Verify deployment configuration
   - Prepare CephFS sync scripts

---

## Troubleshooting

### If AI generates incomplete files:

Re-prompt with:
```
Please complete the implementation of [specific file/feature]. 
Make sure it follows the domain-driven structure and includes:
- Full TypeScript types
- Error handling
- Comments explaining complex logic
- Testing configuration
- Deployment considerations
```

### If dev container fails to build:

Check:
- Docker is running
- VS Code has Dev Containers extension
- Dockerfile syntax is correct
- Port 3000 is not already in use
- Volume mounts are correctly configured

### If dependencies fail to install:

```bash
# Inside container
rm -rf node_modules pnpm-lock.yaml
pnpm install --force
```

### If tests fail:

```bash
# Check test configuration
pnpm test --run
# For E2E tests
pnpm test:e2e --debug
```

### If deployment fails:

```bash
# Check build process
pnpm build
# Verify PM2 configuration
pm2 start ecosystem.config.js
# Check Nginx configuration
nginx -t
```

---

## Deployment Workflow

### Development to Production

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

### Rollback

```bash
# Quick rollback to previous release
cd /cephfs/exam-system/frontend
ln -sfn releases/dev-20251117_180000 current
pm2 restart exam-system-frontend
```

---

