# 🚪 InsightSphere Drawer System

> **Single source of truth untuk drawer dan sheet patterns.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/containers.ts`
> Companion specs: `MODALS.md`, `CARDS.md`, `MOTION.md`

---

## 1. Overview

Drawer = floating panel anchored ke edge screen (right/bottom/left). Dipakai untuk **supplementary content** yang tidak perlu interrupt flow utama — mis. detail view, filter, help panel.

Audit menemukan 62 drawer instances (31 bottom, 16 right, 15 left). Policy ini memformalkan 3 direction + size tiers.

---

## 2. Design Principles

### 2.1 Drawer vs Modal
| Aspect | Modal | Drawer |
|---|---|---|
| **Position** | Centered | Edge-anchored |
| **Interrupts flow?** | Yes (focus required) | No (supplement) |
| **Dismiss** | Complete action atau cancel | Click-outside, Escape, X |
| **Use for** | Confirm, form, alert | Detail, filter, help |

### 2.2 Direction Semantic
| Direction | Semantic | Typical use |
|---|---|---|
| **Right** | Detail / contextual | Product detail, order info, user profile |
| **Bottom** | Mobile sheet / action | Filter, action sheet, mobile menu |
| **Left** | Alternative nav | Category browser, secondary nav |

### 2.3 Backdrop
Drawer pakai backdrop yang sama dengan modal:
```
fixed inset-0 bg-slate-900/60 backdrop-blur-sm
```
Tapi click-outside **selalu close** drawer (tidak ada state "dirty form" yang blocking).

### 2.4 Entrance Animation
Pakai preset dari `motion.ts`:
```
M.drawerEnterRight   = "animate-in slide-in-from-right duration-300"
M.drawerEnterBottom  = "animate-in slide-in-from-bottom-8 duration-300"
M.drawerEnterLeft    = "animate-in slide-in-from-left duration-300"
```

### 2.5 Size Consistency
Drawer width/height konsisten per context:
- Detail drawer → `max-w-md` (right)
- Filter drawer → `max-w-sm` (right/left)
- Mobile sheet → `max-h-[80vh]` (bottom)

---

## 3. Drawer Anatomy

### 3.1 Right Drawer (Detail Panel)
```
┌─────────────────┬──────────────┐
│                 │   DRAWER     │
│  (backdrop)     │  ┌────────┐  │
│                 │  │ Header │  │
│                 │  ├────────┤  │
│                 │  │        │  │
│                 │  │  Body  │  │
│                 │  │        │  │
│                 │  ├────────┤  │
│                 │  │ Footer │  │
│                 │  └────────┘  │
└─────────────────┴──────────────┘
```

### 3.2 Bottom Drawer (Mobile Sheet)
```
┌──────────────────────────────────┐
│                                  │
│  (backdrop)                      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ═══ (grabber)                │ │
│ │ Header                       │ │
│ │                              │ │
│ │ Body                         │ │
│ │                              │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### 3.3 Structure Tokens

```tsx
DRAWER.backdrop  // Same as MODAL.backdrop

DRAWER.right     // "fixed right-0 inset-y-0 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
DRAWER.bottom    // "fixed bottom-0 inset-x-0 rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
DRAWER.left      // "fixed left-0 inset-y-0 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"

DRAWER.size.right.sm    // "w-full max-w-sm"
DRAWER.size.right.md    // "w-full max-w-md"
DRAWER.size.right.lg    // "w-full max-w-2xl"
DRAWER.size.bottom.sm   // "max-h-[50vh]"
DRAWER.size.bottom.md   // "max-h-[70vh]"
DRAWER.size.bottom.lg   // "max-h-[85vh]"
```

---

## 4. Usage Examples

### 4.1 Right Detail Drawer (Product Detail)
```tsx
import { DRAWER } from "@/app/lib/containers";
import { M } from "@/app/lib/motion";

{isOpen && (
  <div className={cn(DRAWER.backdrop, M.backdropEnter)} onClick={onClose}>
    <aside
      className={cn(DRAWER.right, DRAWER.size.right.md, M.drawerEnterRight)}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-bold">Detail Produk</h2>
        <button className={MODAL.close} onClick={onClose}>
          <X className="size-4" />
        </button>
      </header>
      <main className="p-6 space-y-6">
        {/* detail content */}
      </main>
      <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button className={btn("outline", "md")} onClick={onClose}>Tutup</button>
        <button className={btn("primary", "md")}>Edit</button>
      </footer>
    </aside>
  </div>
)}
```

### 4.2 Bottom Mobile Sheet (Filter)
```tsx
<div className={cn(DRAWER.backdrop, M.backdropEnter)} onClick={onClose}>
  <section
    className={cn(DRAWER.bottom, DRAWER.size.bottom.md, M.drawerEnterBottom)}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Optional grabber indicator */}
    <div className="pt-3 pb-2 flex justify-center">
      <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
    </div>
    <header className="px-6 py-3">
      <h2 className="text-base font-bold">Filter Transaksi</h2>
    </header>
    <main className="px-6 pb-6 space-y-4">
      {/* filter fields */}
    </main>
    <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
      <button className={btn("ghost", "md")} onClick={reset}>Reset</button>
      <button className={cn(btn("primary", "md"), "flex-1")} onClick={apply}>Terapkan Filter</button>
    </footer>
  </section>
</div>
```

### 4.3 Left Drawer (Category Browser)
```tsx
<div className={cn(DRAWER.backdrop, M.backdropEnter)} onClick={onClose}>
  <nav
    className={cn(DRAWER.left, DRAWER.size.right.sm, M.drawerEnterLeft)}
    onClick={(e) => e.stopPropagation()}
  >
    <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <h2 className="text-base font-bold">Kategori</h2>
    </header>
    <ul className="p-4 space-y-1">
      {categories.map(cat => (
        <li key={cat.id}>
          <button
            className={cn(
              "w-full text-left px-3 py-2 rounded-xl text-sm",
              "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            )}
          >
            {cat.name}
          </button>
        </li>
      ))}
    </ul>
  </nav>
</div>
```

### 4.4 Action Sheet (Bottom, Compact)
```tsx
<div className={cn(DRAWER.backdrop, M.backdropEnter)} onClick={onClose}>
  <div className={cn(DRAWER.bottom, DRAWER.size.bottom.sm, M.drawerEnterBottom)}>
    <div className="p-4 space-y-2">
      <button className={cn(btn("ghost", "lg"), "w-full justify-start")}>
        <Edit className="size-4" /> Edit Produk
      </button>
      <button className={cn(btn("ghost", "lg"), "w-full justify-start")}>
        <Copy className="size-4" /> Duplikat
      </button>
      <button className={cn(btn("ghost", "lg"), "w-full justify-start text-rose-600")}>
        <Trash2 className="size-4" /> Hapus
      </button>
    </div>
  </div>
</div>
```

---

## 5. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Drawer tanpa backdrop | Visually floating without context | Include `DRAWER.backdrop` |
| `rounded-3xl` untuk right/left drawer | Only bottom drawer has top-rounded corners | Right/left tanpa radius or subtle `rounded-l-3xl` |
| Drawer width > 80% viewport di desktop | Claustrophobic, should be modal | `max-w-md` or `max-w-lg` |
| Bottom drawer > `max-h-[90vh]` | Tidak ada backdrop visible, feels modal | Max `max-h-[85vh]` |
| Drawer animation < 300ms | Too quick, feels janky | `duration-300` standard |
| Drawer tanpa escape/click-outside handling | A11y fail | Include both |
| Custom slide distance (`slide-in-from-right-52`) | Divergent UX | Standard preset |
| Modal-style confirm di drawer | Wrong pattern | Use modal instead |

---

## 6. Migration Guide

### 6.1 Animation Unification
Ganti manual animation ke preset:
```diff
- "animate-in slide-in-from-right-52 duration-500"
+ M.drawerEnterRight  // "animate-in slide-in-from-right duration-300"
```

### 6.2 Bottom Drawer Grabber
Tambahkan grabber indicator untuk mobile sheets (UX affordance for swipe-to-close):
```tsx
<div className="pt-3 pb-2 flex justify-center">
  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
</div>
```

### 6.3 Sheet to Drawer Consolidation
Audit `<Sheet>` (16 uses) vs `<Drawer>` (10 uses) shadcn components — consider unifying mental model. Both serve similar purposes.

### Per-page priority
Dashboard → Kasir → Inventaris → dst.

### Code review rubric
1. Drawer tanpa backdrop? → **reject**
2. Animation string manual (bukan `M.drawerEnter*`)? → **request change**
3. Width > 80vw di desktop? → **request change** (consider modal)
4. Missing close button X? → **request change**
5. Bottom drawer tanpa rounded-top? → **request change**
6. Right/left drawer dengan `rounded-3xl` full (bukan only edge)? → **request change**

---

## 7. Future Enhancements

- [ ] Swipe-to-close gesture untuk bottom drawer (mobile)
- [ ] Stacked drawer (drawer in drawer) — consider architecture
- [ ] Resizable drawer (drag handle untuk resize width/height)
- [ ] Snap points (`Drawer.Content` di shadcn pakai pola ini)
- [ ] Exit animation presets (`M.drawerExitRight`, dst)
- [ ] Integration dengan URL state (`?detail=123` → open drawer)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
