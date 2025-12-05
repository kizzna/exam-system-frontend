# OMR Editor optimization v2
Current experience: 0.5s for showing a new sheet.
Analysis highlights of classic "Data-Rich Dashboard" performance bottleneck. 
While 0.5s sounds fast, in a repetitive workflow (reviewing 1000 sheets), it feels sluggish.

Optimization plan to get this down to **< 100ms** (instant feel).

### 1. The DOM Bottleneck: Virtualization (Critical)
**Problem:** Panel C is **1MB of HTML**. Rendering 1,366 rows of complex Flexbox/SVG icons causes a "Style Recalculation" storm every time user click a row. React has to diff the entire tree.

**Solution:** Implement **Windowing (Virtualization)** immediately. This will reduce the DOM from 1,366 rows to ~15 rows.

**Implementation with `@tanstack/react-virtual`:**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Inside component
const parentRef = useRef(null);

const rowVirtualizer = useVirtualizer({
  count: rosterData.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Estimate height
  overscan: 5, // Render 5 rows above/below view to prevent white flash
});

return (
  <div ref={parentRef} className="flex-1 overflow-auto bg-white p-4">
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const student = rosterData[virtualRow.index];
        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
             {/* ... Row Component ... */}
          </div>
        );
      })}
    </div>
  </div>
);
```
*Result:* Memory usage will drop by large margin and click responsiveness will become instant.

---

### 2. The Network Bottleneck: Aggressive Prefetching
**Problem:** Waiting 0.5s for the image *after* clicking is the main perceived lag. The browser waits for the click to fire the network request.

**Solution:** Prefetch the **next 3 sheets** logic.

Create a simple hook or `useEffect` that watches `selectedSheetIndex`.

```tsx
useEffect(() => {
  if (!rosterData) return;
  
  // Calculate next 3 indices
  const nextIndices = [1, 2, 3]
    .map(offset => selectedIndex + offset)
    .filter(idx => idx < rosterData.length);

  nextIndices.forEach(idx => {
    const sheet = rosterData[idx];
    if (!sheet.sheet_id) return;

    // 1. Prefetch Top Image
    const imgTop = new Image();
    imgTop.src = `/api/v1/images/${sheet.sheet_id}/render?part=top`;

    // 2. Prefetch Bottom Image
    const imgBottom = new Image();
    imgBottom.src = `/api/v1/images/${sheet.sheet_id}/render?part=bottom`;
    
    // 3. Prefetch Overlay Data (If using React Query)
    queryClient.prefetchQuery({
       queryKey: ['overlay', sheet.sheet_id],
       queryFn: () => fetchOverlay(sheet.sheet_id)
    });
  });
}, [selectedIndex, rosterData]);
```
*Result:* When the user presses "Down Arrow", the image is likely already in the browser disk cache (Status: 200 OK (from disk cache)).

---


### 3. UI/UX: Panel B Optimization
**Problem:** Stats take up too much vertical space, leaving no room for "Actions".

**Solution:** Move to a **"Toolbar" Layout**.
Convert the big number cards into a slim horizontal strip at the top of Panel B, or merge Panel B's header.

**Proposed Layout for Panel B (Right Column, Top):**

```tsx
<div className="col-span-5 row-span-5 bg-white border rounded shadow flex flex-col h-full">
  
  {/* 1. Slim Stats Bar (Fixed Height) */}
  <div className="h-14 border-b flex items-center justify-between px-4 bg-slate-50">
     <div className="flex gap-4 text-sm">
        <div className="flex flex-col">
           <span className="text-[10px] text-slate-500 uppercase">Processed</span>
           <span className="font-bold text-slate-700">901 <span className="text-slate-400">/ 1366</span></span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200" />
        <div className="flex flex-col">
           <span className="text-[10px] text-red-500 uppercase">Errors</span>
           <span className="font-bold text-red-600">137 <span className="text-xs font-normal bg-red-100 px-1 rounded">15%</span></span>
        </div>
     </div>
     
     {/* Primary Action Button */}
     <Button size="sm">Mark Complete</Button>
  </div>

  {/* 2. Error Categories (Scrollable Area) */}
  <div className="flex-1 overflow-auto p-4">
     <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Action Required</h3>
     <div className="grid grid-cols-2 gap-2">
        <ErrorButton label="Duplicate" count={64} color="orange" />
        <ErrorButton label="ID Error" count={26} color="red" />
        <ErrorButton label="Center Code" count={51} color="purple" />
     </div>
  </div>

  {/* 3. Batch Tools (Bottom Footer) */}
  <div className="p-3 bg-slate-50 border-t mt-auto">
     <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Tools</h3>
     <div className="flex gap-2">
        <Button variant="outline" size="xs">Re-read Profile</Button>
        <Button variant="outline" size="xs">Bulk Move</Button>
     </div>
  </div>
</div>
```