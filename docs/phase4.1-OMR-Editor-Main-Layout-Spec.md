# Phase 4.1: OMR Editor Main Layout Specification

**Date:** December 1, 2025
**Priority:** High (Foundation for Phase 4)
**Context:** This document defines the structural layout for the OMR Correction Interface. This is a **single-screen, non-scrolling desktop application**.

## 1. Objective
Create the main scaffold using **CSS Grid**. The goal is to establish the 4-panel split-screen layout defined in the requirements. No business logic is required yet; we are building the container that will hold the Image Viewers and the Data Table.

## 2. Technical Constraints
*   **Framework:** Next.js 15 (App Router).
*   **Styling:** Tailwind CSS.
*   **Viewport:** The page must take up exactly `100vh` and `100vw`.
*   **Scrolling:** **Global scrolling must be disabled.** Only specific internal panels (the Table) will scroll.

## 3. The Layout Design
We will use a **12x12 Grid System** to achieve the requested proportions.

**Proportions:**
*   **Horizontal Split:** Left (58%) / Right (42%) $\approx$ `7/12` and `5/12`.
*   **Vertical Split:** Top (42%) / Bottom (58%) $\approx$ `5/12` and `7/12`.

**Visual Map:**
```text
(Viewport: 100vw x 100vh)
┌───────────────────────────────┬──────────────────────┐
│  PANEL A: Header Image        │  PANEL B: Stats      │
│  (Student Info Crop)          │  (Counts & Actions)  │
│                               │                      │
│  col-span-7                   │  col-span-5          │
│  row-span-5                   │  row-span-5          │
├───────────────────────────────┼──────────────────────┤
│  PANEL C: Data Table          │  PANEL D: Answers    │
│  (TanStack Virtual List)      │  (150 Qs Image Crop) │
│                               │                      │
│                               │                      │
│  col-span-7                   │  col-span-5          │
│  row-span-7                   │  row-span-7          │
└───────────────────────────────┴──────────────────────┘
```

## 4. Implementation Steps

### Step 1: Page Implementation (`app/dashboard/tasks/[taskId]/review/page.tsx`)

Copy this scaffold code to create the layout. I have added colored borders and labels to make it easy to visualize during development.

```tsx
import React from 'react';

// Placeholder components (Create these files later)
// import { HeaderImageViewer } from './_components/header-image-viewer';
// import { StatsPanel } from './_components/stats-panel';
// import { StudentTable } from './_components/student-table';
// import { AnswerImageViewer } from './_components/answer-image-viewer';

export default function OMRReviewPage({ params }: { params: { taskId: string } }) {
  return (
    <main className="h-screen w-screen bg-slate-50 p-2 overflow-hidden flex flex-col">
      
      {/* Optional: Minimal Global Header (Breadcrumbs/Back Button) */}
      <header className="h-10 shrink-0 flex items-center px-2 mb-2 gap-4">
        <h1 className="font-bold text-sm text-slate-700">Task Review: {params.taskId}</h1>
        {/* Add Back Button Here */}
      </header>

      {/* CORE GRID LAYOUT */}
      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-3 min-h-0">
        
        {/* --- PANEL A: Top Left (Header Image) --- */}
        {/* Proportions: ~58% width, ~42% height */}
        <section className="col-span-7 row-span-5 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
           <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
             Panel A: Header Image Crop
           </div>
           {/* <HeaderImageViewer /> */}
           <div className="flex-1 flex items-center justify-center bg-slate-100/50">
             <span className="text-slate-400 text-sm">Image Canvas (Zoom/Pan)</span>
           </div>
        </section>

        {/* --- PANEL B: Top Right (Stats & Tools) --- */}
        {/* Proportions: ~42% width, ~42% height */}
        <section className="col-span-5 row-span-5 bg-white rounded-lg border shadow-sm p-4 overflow-y-auto">
           <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
             Panel B: Stats & Actions
           </div>
           {/* <StatsPanel /> */}
           <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-red-50 rounded border border-red-100 flex items-center justify-center text-red-600 font-bold">
                 Errors: 12
              </div>
              <div className="h-20 bg-blue-50 rounded border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                 Processed: 1,140
              </div>
           </div>
        </section>

        {/* --- PANEL C: Bottom Left (Data Table) --- */}
        {/* Proportions: ~58% width, ~58% height */}
        <section className="col-span-7 row-span-7 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
           <div className="p-2 border-b bg-slate-50 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500">Panel C: Student Roster</span>
             <input type="text" placeholder="Search..." className="text-xs border rounded px-2 py-1" />
           </div>
           
           {/* Table Container - Must allow internal scrolling */}
           <div className="flex-1 overflow-auto bg-white p-4">
             {/* <StudentTable /> */}
             <div className="space-y-2">
                {[...Array(20)].map((_, i) => (
                   <div key={i} className="h-8 w-full bg-slate-50 rounded animate-pulse" />
                ))}
             </div>
           </div>
        </section>

        {/* --- PANEL D: Bottom Right (Answer Image) --- */}
        {/* Proportions: ~42% width, ~58% height */}
        <section className="col-span-5 row-span-7 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
           <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
             Panel D: Answer Sheet Overlay
           </div>
           {/* <AnswerImageViewer /> */}
           <div className="flex-1 flex items-center justify-center bg-slate-100/50">
             <span className="text-slate-400 text-sm">Answer Grid & Overlays</span>
           </div>
        </section>

      </div>
    </main>
  );
}
```

### Step 2: Styling Notes (Tailwind)

*   `h-screen`: Forces the root container to match the viewport height exactly.
*   `overflow-hidden`: Prevents the browser window from scrolling.
*   `min-h-0`: This is a **crucial** CSS Grid/Flex hack. Without this on the grid container or items, nested scrollbars often break (the container expands to fit content instead of forcing content to scroll).
*   `gap-3`: Provides separation between panels without wasting too much screen real estate.

## 5. Mobile / Tablet Strategy
**Important:** This interface is too dense for mobile phones.

Add this CSS utility class to your main wrapper to hide the editor on small screens and show a warning instead:

```tsx
// At the top of your page return:
<div className="block lg:hidden h-screen w-screen flex items-center justify-center bg-slate-50 p-8 text-center">
  <div className="max-w-md">
    <h2 className="text-xl font-bold text-slate-800 mb-2">Desktop Required</h2>
    <p className="text-slate-600">The OMR Correction Editor requires a large screen to display documents and data side-by-side. Please open this task on a computer.</p>
  </div>
</div>
<div className="hidden lg:flex ..."> 
  {/* The Grid Code from Step 1 goes here */}
</div>
```

## 6. Acceptance Criteria (How to Test)
1.  Open the page on a 1920x1080 monitor.
2.  Resize the browser window down to 1024x768.
3.  **Result:** The panels should shrink proportionally. The global window scrollbar should **never** appear.
4.  Zoom the browser to 110%.
5.  **Result:** The layout should adjust, keeping all 4 panels visible.
6.  Open on a mobile phone simulator.
7.  **Result:** Should see the "Desktop Required" warning.