# Exam Management System - Frontend

A comprehensive Next.js 15 frontend for exam grading and management, built with TypeScript, TailwindCSS, and shadcn/ui.

## 🚀 Tech Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.6
- **Runtime:** Node.js 20 LTS
- **Package Manager:** pnpm

### UI & Styling
- **UI Library:** shadcn/ui (Tailwind CSS + Radix UI)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Tables:** TanStack Table

### State Management & Data
- **Server State:** React Query v5 (TanStack Query)
- **Client State:** Zustand with persist middleware
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios with token refresh interceptors

### Development Tools
- **Dev Environment:** VS Code Dev Containers
- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier with Tailwind plugin
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Git Hooks:** Husky + lint-staged

## 📋 Prerequisites

- Docker Desktop (for dev container)
- VS Code with Dev Containers extension
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd exam-system-frontend
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

### 3. Open in Dev Container

#### VS Code
1. Open the project in VS Code
2. Press `Cmd/Ctrl + Shift + P`
3. Select "Dev Containers: Reopen in Container"
4. Wait for container to build and dependencies to install

#### Manual Docker
```bash
cd .devcontainer
docker-compose up -d
docker-compose exec frontend bash
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
exam-system-frontend/
├── .devcontainer/         # Dev container configuration
├── app/                   # Next.js App Router
│   ├── (auth)/           # Auth pages (login)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # Reusable React components
│   ├── auth/             # Auth components
│   ├── users/            # User components
│   ├── batches/          # Batch upload components
│   ├── tasks/            # Task management components
│   ├── sheets/           # Sheet review components
│   ├── grading/          # Grading components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core utilities & services
│   ├── api/              # API client & endpoints
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── providers/        # React context providers
├── tests/                 # Test files
│   ├── e2e/              # Playwright E2E tests
│   └── unit/             # Vitest unit tests
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🧪 Testing

### Unit Tests (Vitest)
```bash
pnpm test              # Run tests
pnpm test:watch        # Watch mode
```

### E2E Tests (Playwright)
```bash
pnpm test:e2e          # Run E2E tests
pnpm test:e2e --ui     # Open Playwright UI
```

## 🎨 Code Quality

### Linting
```bash
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix linting issues
```

### Formatting
```bash
pnpm format            # Format code with Prettier
```

### Type Checking
```bash
pnpm type-check        # Run TypeScript compiler
```

## 🚢 Deployment

### Build for Production
```bash
pnpm build             # Build Next.js app
pnpm start             # Start production server
```

### Deploy to CephFS
```bash
# Quick sync (development)
./scripts/dev-sync-frontend.sh

# Production deploy (with build)
./scripts/dev-sync-frontend.sh --build

# Dry run (preview changes)
./scripts/dev-sync-frontend.sh --dry-run
```

### PM2 Deployment
```bash
# On gt-omr-web-1
cd /cephfs/exam-system/frontend/current
pm2 start ecosystem.config.js
pm2 logs exam-system-frontend
pm2 restart exam-system-frontend
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXTAUTH_URL` | Frontend URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Auth secret key | - |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | `true` |

## 📚 Development Workflow

### Daily Development
1. Start dev container
2. Run `pnpm dev`
3. Make changes
4. Run tests
5. Commit with conventional commits

### Pre-commit Hooks
Husky automatically runs:
- ESLint
- Prettier
- Type checking

### Phase-Based Development
This project follows a 7-phase development approach:

- **Phase 1:** Authentication & User Management (Weeks 1-2)
- **Phase 2:** Batch Upload Interface (Weeks 3-4)
- **Phase 3:** Task Management (Weeks 5-7)
- **Phase 4:** Sheet Review Interface (Weeks 8-12)
- **Phase 5:** Grading & Exports (Weeks 13-14)
- **Phase 6:** Search & Audit (Weeks 15-16)
- **Phase 7:** Hierarchy Management (Weeks 17-20)

## 🐛 Troubleshooting

### Dev Container Issues
```bash
# Rebuild container
Cmd/Ctrl + Shift + P → "Dev Containers: Rebuild Container"

# Or manually
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Dependency Issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running on specified URL
- Check CORS configuration on backend

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

## 📖 Additional Documentation

- [Frontend Setup Prompt](docs/FRONTEND_SETUP_PROMPT.md) - Detailed setup instructions
- [Phase Implementation Guides](docs/) - Phase-specific implementation notes

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Commit with conventional commits
5. Create pull request

## 📝 License

[Your License Here]

## 👥 Team

- **Backend Team:** FastAPI domain-driven architecture
- **Frontend Team:** Next.js 15 development

## 🔗 Related Projects

- Backend API: [exam-system-backend](../exam-system-backend)
- Documentation: [docs](./docs)

---

**Version:** 0.1.0  
**Last Updated:** November 18, 2025
