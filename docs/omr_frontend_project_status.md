# OMR Frontend Project Status

## Project Summary
Running on **Next.js 15**, **React 18**, and **TypeScript** with **Tailwind CSS**. State management handles by **Zustand** and **React Query**.

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI) + Lucide Icons
- **State Management**: React Query (Server state), Zustand (Client state)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Playwright

### Current Status
- **OMR Grading System**: Fully operational in production.
  - Processed **990,237+ sheets**.
  - Error rate reduced to **<5%** (compared to 10-20% in legacy).
  - Correction time significantly reduced.
  - Implements complex logic for batch scanning, grading, and auditing.
- **Registration System**: Currently relying on **Legacy Yii2** system.
  - Includes Exam Center, Temple, School, Student Record, Distributor, and Schedule management.
  - None of these modules are currently migrated to this Next.js platform.

---

## Architecture Recommendation: Unified Platform (Monolith)

We strongly recommend **merging** the Registration System into this existing Next.js platform rather than creating a separate website.

### why "Merge" is better than "Split"?
Although the design requirements differ ("Clean" OMR vs "Data-heavy" Registration), splitting them creates long-term maintenance debt:
1.  **Shared Entities**: Both systems heavily rely on **Students**, **Schools**, and **Exam Centers**. Splitting would require duplicating these type definitions and API clients, leading to "Type drift" and bugs.
2.  **Unified Auth**: A user (Admin/Staff) often needs to switch between checking a registration status and verifying a score. A single app allows seamless navigation without re-login or complex SSO setups.
3.  **Code Reuse**: You already have a robust set of UI components (`components/ui`) and utility libraries (`lib/utils`). A separate project would need to copy-paste these, eventually diverging into two incompatible UI libraries.
4.  **Operational Simplicity**: One build pipeline, one domain (or easy subdomain handling), and one deployment process are easier to manage for a small-to-medium team.

### How to solve the "Messy" & "Design Divergence" problem?
The "messiness" comes from mixing concerns. The solution is **Next.js Route Groups**.

We can structure the project to have two distinct "Zones" with completely different layouts and design rules, co-existing peacefully:

```text
app/
├── (auth)/                # Shared Authentication pages
├── (omr)/                 # OMR Domain (Current Minimalist/Clean Design)
│   ├── layout.tsx         # <--- OMR specific layout (Sidebar, Focus mode)
│   ├── dashboard/         # Existing grading/review pages
│   └── ...
├── (registration)/        # NEW Registration Domain (Data-Dense/Dashboard Design)
│   ├── layout.tsx         # <--- Registration specific layout (Top nav, different theme)
│   ├── exam-centers/
│   ├── students/
│   └── ...
└── api/                   # Shared API handlers
```

**Benefits of this structure:**
- **Distinct Visuals**: `(omr)/layout.tsx` can enforce a distraction-free environment for grading, while `(registration)/layout.tsx` can provide a dense, information-rich dashboard for management.
- **Shared Core**: Both folders still import from `components/ui/*` and `lib/*`.
- **Clean Boundaries**: Developers know exactly where to put code. "If it's about applying, it goes in `(registration)`". "If it's about scoring, it goes in `(omr)`".

### Conclusion
**Do not split.** Adopt a **Module-based Monolith** approach using Next.js Route Groups. This gives you the separation you need (different designs) without the overhead you don't want (duplicated code, separate deployments).
