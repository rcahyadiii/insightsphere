# 🪟 InsightSphere Modal & Dialog System

> **Single source of truth untuk modal, dialog, dan overlay patterns.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/containers.ts`
> Companion specs: `CARDS.md`, `DRAWERS.md`, `MOTION.md`, `BUTTONS.md`

---

## 1. Overview

InsightSphere memakai **modal** untuk action-based flows (confirm, form, details) yang butuh focus user. Audit menemukan 29 overlay instances + 7 hand-rolled modal files + 16 shadcn `<Dialog>` — pattern sudah semi-established tapi duplikasi structure di banyak tempat.

Policy ini memformalkan anatomi standar untuk unifikasi.

---

## 2. Design Principles

### 2.1 Modal vs Drawer
- **Modal** = centered, demands focus, interrupts flow (confirm, form, alert)
- **Drawer** = edge-anchored, supplements main view (detail, filter, help)

Gunakan modal untuk action yang butuh completion sebelum lanjut. Untuk read/browse, prefer drawer.

### 2.2 Backdrop Standard
Backdrop **wajib** pakai:
```
fixed inset-0 bg-slate-900/60 backdrop-blur-sm
```
- `/60` opacity (established, 22 instances) — bukan `/50` atau `/40`
- `backdrop-blur-sm` default (established, 18 instances)
- `backdrop-blur-md` untuk heavy context (image modal, immersive)

### 2.3 Entrance Animation (Established Preset)
Pakai `M.modalEnter` dari `motion.ts`:
```
animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200
```

### 2.4 Focus & Keyboard (A11y)
- Escape key → close modal
- Click backdrop → close modal (unless destructive/form with changes)
- Focus trap → tab cycles within modal
- Return focus → to trigger on close

### 2.5 Size Consistency
Semua modal dari 1 flow harus punya size consistent (mis. semua form modal pakai `max-w-md`).

---

## 3. Modal Anatomy

```
┌──────────────────────────────────────────┐  ← Backdrop (full screen)
│                                          │
│    ┌──────────────────────────────────┐  │  ← Container
│    │ Header (icon + title + close X)  │  │
│    ├──────────────────────────────────┤  │
│    │                                  │  │
│    │        Body (main content)       │  │
│    │                                  │  │
│    ├──────────────────────────────────┤  │
│    │ Footer ([Cancel] [Confirm])      │  │
│    └──────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### 3.1 Structure Tokens

```tsx
MODAL.backdrop   // "fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
MODAL.container  // "rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
MODAL.header     // "px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3"
MODAL.body       // "p-6"
MODAL.footer     // "px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2"
MODAL.close      // "p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
```

### 3.2 Size Tiers

| Tier | `max-w-*` | Width | Use case |
|:---:|:---:|:---:|---|
| `sm` | `max-w-sm` | 384px | Confirm dialog, simple alert |
| `md` | `max-w-md` | 448px | **Default** — simple form, info |
| `lg` | `max-w-2xl` | 672px | Multi-field form, data edit |
| `xl` | `max-w-4xl` | 896px | Complex form, data table |
| `full` | `max-w-[95vw]` | Near-full | Image viewer, rich content |

### 3.3 Header Icon Box Pattern

Setiap modal punya icon dengan warna match dengan semantic action:

| Action | Icon color | Example |
|---|---|---|
| Add / Create | `indigo` | `<Plus />` |
| Edit / Update | `amber` | `<Pencil />` |
| Delete / Destructive | `rose` | `<Trash2 />` |
| Confirm success | `emerald` | `<Check />` |
| Info / Preview | `slate` | `<Eye />` |

```tsx
<div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
  <Plus className="size-5 text-indigo-600 dark:text-indigo-400" />
</div>
```

---

## 4. Usage Examples

### 4.1 Basic Modal (Form Create)
```tsx
import { MODAL } from "@/app/lib/containers";
import { M } from "@/app/lib/motion";
import { btn } from "@/app/lib/buttons";
import { AnimatePresence, motion } from "framer-motion";

{isOpen && (
  <div className={cn(MODAL.backdrop, M.backdropEnter)} onClick={onClose}>
    <div className="flex items-center justify-center min-h-screen p-4">
      <div
        className={cn(MODAL.container, MODAL.size.md, M.modalEnter)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={MODAL.header}>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Plus className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold">Tambah Produk</h2>
            <p className="text-xs text-slate-500">Lengkapi data di bawah</p>
          </div>
          <button className={MODAL.close} onClick={onClose}>
            <X className="size-4" />
          </button>
        </header>
        <main className={MODAL.body}>
          {/* form fields */}
        </main>
        <footer className={MODAL.footer}>
          <button className={btn("outline", "md")} onClick={onClose}>Batal</button>
          <button className={btn("primary", "md")} onClick={onSubmit}>Simpan</button>
        </footer>
      </div>
    </div>
  </div>
)}
```

### 4.2 Destructive Confirmation
```tsx
<div className={cn(MODAL.container, MODAL.size.sm)}>
  <div className="p-6 text-center space-y-4">
    <div className="mx-auto size-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
      <AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />
    </div>
    <div>
      <h2 className="text-base font-bold">Hapus Produk?</h2>
      <p className="text-sm text-slate-500 mt-1">
        Tindakan ini tidak dapat dibatalkan.
      </p>
    </div>
  </div>
  <footer className={MODAL.footer}>
    <button className={btn("outline", "md")} onClick={onCancel}>Batal</button>
    <button className={btn("destructive", "md")} onClick={onDelete}>
      <Trash2 /> Hapus Permanen
    </button>
  </footer>
</div>
```

### 4.3 Success Modal (post-action)
```tsx
<div className={cn(MODAL.container, MODAL.size.sm, "p-8 text-center space-y-4")}>
  <div className="mx-auto size-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
    <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
  </div>
  <div>
    <h2 className="text-base font-bold">Pembayaran Berhasil</h2>
    <p className="text-sm text-slate-500 mt-1">Transaksi TXN-12345 telah dicatat</p>
  </div>
  <button className={cn(btn("success", "lg"), "w-full")} onClick={onClose}>
    Kembali ke POS
  </button>
</div>
```

### 4.4 Large Form Modal (multi-section)
```tsx
<div className={cn(MODAL.container, MODAL.size.lg)}>
  <header className={MODAL.header}>
    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
      <Pencil className="size-5 text-amber-600 dark:text-amber-400" />
    </div>
    <h2 className="flex-1 text-base font-bold">Edit Produk</h2>
    <button className={MODAL.close} onClick={onClose}><X className="size-4" /></button>
  </header>
  <main className={cn(MODAL.body, "space-y-6 max-h-[70vh] overflow-y-auto")}>
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        Informasi Dasar
      </h3>
      <div className="space-y-4">{/* fields */}</div>
    </section>
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        Harga & Stok
      </h3>
      <div className="space-y-4">{/* fields */}</div>
    </section>
  </main>
  <footer className={MODAL.footer}>
    <button className={btn("outline", "md")}>Batal</button>
    <button className={btn("primary", "md")}>Simpan Perubahan</button>
  </footer>
</div>
```

---

## 5. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Backdrop `/50` atau `/40` | Violates standard | `bg-slate-900/60` |
| No `backdrop-blur-sm` | Flat backdrop, cheap feel | Include blur |
| Custom animation string ad-hoc | Divergent UX | `M.modalEnter` preset |
| Modal tanpa close button | A11y + UX fail | Include X close button |
| `rounded-2xl` untuk modal | Terlalu kecil untuk overlay | `rounded-3xl` |
| `shadow-lg` untuk modal | Insufficient elevation | `shadow-2xl` |
| Scrollable body tanpa max-height | Mobile cut-off | `max-h-[70vh] overflow-y-auto` |
| 2+ primary CTA di footer | Emphasis conflict | 1 primary + 1-2 secondary |
| Click-outside = close untuk form | User loses progress | Warn before close |
| Modal stacking (modal in modal) | A11y nightmare | Replace outer or close first |
| Custom backdrop color (non-slate-900) | Palette violation | `bg-slate-900/60` |

---

## 6. Migration Guide

### 6.1 Backdrop Standardization
Scan untuk `bg-slate-900/50` dan `bg-slate-900/40` → ganti ke `bg-slate-900/60`.

### 6.2 Animation Unification
Semua modal animation diragam ke `M.modalEnter`:
```diff
- "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-8 duration-300"
+ M.modalEnter  // "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
```

### 6.3 Hand-rolled Modal Consolidation
7 file modal (ExcelImportModal, StockOpnameModal, dst) bisa refactor extract common header/body/footer ke `<ModalShell>` wrapper component, atau tinggal pakai `MODAL.*` tokens.

### Per-page priority
Dashboard → Kasir → Inventaris → dst.

### Code review rubric
1. Backdrop ≠ `bg-slate-900/60`? → **request change**
2. Missing `backdrop-blur-sm`? → **request change**
3. Animation string manual (bukan `M.modalEnter`)? → **request change**
4. Missing close button? → **reject** (a11y)
5. `rounded-2xl` or smaller untuk modal? → **request change**
6. Multiple primary CTA? → **request change**
7. Body scrollable tanpa `max-h-*`? → **request change**

---

## 7. Future Enhancements

- [ ] Create dedicated `<Modal>` wrapper component dengan built-in Escape handling
- [ ] Focus trap integration (React Aria or radix-focus-guards)
- [ ] Modal stack management (queue, replace)
- [ ] Exit animation (`M.modalExit`) integration
- [ ] Scroll-lock on body when modal open
- [ ] Accessibility audit (ARIA role=dialog, aria-modal, aria-labelledby)
- [ ] Storybook page dengan live preview semua size tiers + variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
