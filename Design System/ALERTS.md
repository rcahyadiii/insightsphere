# 🚨 InsightSphere Alert System

> **Single source of truth untuk inline alert banners dan notification messages.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/feedback.ts`
> Companion specs: `TOASTS.md`, `COLORS.md`, `BADGES.md`

---

## 1. Overview

InsightSphere punya **100+ hand-rolled alert banner** tersebar dengan styling variance tinggi:
- Emerald (success): 34 instances, 10 pola berbeda
- Amber (warning): 27 instances, 10 pola berbeda
- Indigo (info/primary): 25 instances, 10 pola berbeda
- Rose (error): 15+ instances, 10+ pola berbeda

**Zero shared component** — ini issue paling kritis dari audit feedback. Policy ini memformalkan 5 semantic variants + 3 size tiers + dismissable pattern.

---

## 2. Alert vs Toast (Mental Model)

| Aspect | Alert (persistent) | Toast (transient) |
|---|---|---|
| **Duration** | Stays until dismissed or nav | Auto-dismiss after ~3s |
| **Placement** | Inline (in page/card/modal) | Floating (edge of viewport) |
| **Importance** | Medium-high (may block flow) | Low-medium (informational) |
| **Use for** | Form errors, page-level status, onboarding hints | Action confirmation, quick feedback |
| **User action** | Must acknowledge / dismiss | Passive observation |

**Rule:** Jangan pakai toast untuk critical error yang user harus action. Pakai alert inline.

---

## 3. Design Principles

### 3.1 5 Semantic Variants
| Variant | Icon | Use case |
|---|---|---|
| `success` | `CheckCircle2` | Payment done, item saved |
| `warning` | `AlertTriangle` | Stock low, unusual data |
| `destructive` | `AlertCircle` | Error, validation failure |
| `info` | `Info` | Neutral notification, tip |
| `primary` | `Sparkles` / `Lightbulb` | Feature promotion, onboarding |

### 3.2 Wajib Icon + Text
Alert tanpa icon = weak affordance. Setiap alert **wajib** punya:
- Leading icon (`size-5` default, match variant semantic)
- Title (bold)
- Optional description (lighter weight)
- Optional action button / link
- Optional close X button (dismissable)

### 3.3 Dark Mode Parity (Wajib)
Dari `COLORS.md` DARK_MODE_PAIRING:
```
bg-emerald-50 → dark:bg-emerald-900/30
border-emerald-200 → dark:border-emerald-800/50
text-emerald-900 → dark:text-emerald-100
```

### 3.4 Size Hierarchy (3 tiers)
| Tier | Padding | Text | Use |
|:---:|:---:|:---:|---|
| `sm` | `p-3` | `text-xs` | Inline form error, compact contexts |
| **`md`** | **`p-4`** | **`text-sm`** | **Default** |
| `lg` | `p-5` | `text-sm` | Hero/banner-style (page-top alert) |

### 3.5 Placement Rules
| Placement | Example | Border handling |
|---|---|---|
| **Page-top** | PortalTemplate error banner | Full width, rounded |
| **In card** | Form validation summary | Same card-internal padding |
| **In modal** | Confirmation caveat | Fit modal width |
| **In row** | Table row warning | Compact (`sm`) + `rounded-md` |

---

## 4. Anatomy

```
┌────────────────────────────────────────────────────┐
│ [icon] Title text                            [✕]  │  ← Row 1: icon + title + optional close
│        Description text (optional)                 │  ← Row 2: description
│        [Action] [Secondary Action] (optional)      │  ← Row 3: actions
└────────────────────────────────────────────────────┘
```

### 4.1 Structure Classes
```
ALERT.base          // rounded-xl + border + p-4 + flex items-start gap-3
ALERT.variant.*     // bg + border + text (semantic colored)
ALERT.icon.*        // icon color per variant
ALERT.title         // text-sm font-bold
ALERT.description   // text-xs mt-0.5 opacity-80
ALERT.close         // ml-auto + p-1 + rounded-lg + hover bg
ALERT.size.{sm|md|lg}
```

---

## 5. Usage Examples

### 5.1 Basic Success Alert
```tsx
import { ALERT } from "@/app/lib/feedback";
import { CheckCircle2 } from "lucide-react";

<div className={cn(ALERT.base, ALERT.variant.success)}>
  <CheckCircle2 className={cn("size-5 shrink-0", ALERT.icon.success)} />
  <div className="flex-1">
    <h4 className={ALERT.title}>Pembayaran Berhasil</h4>
    <p className={ALERT.description}>
      Transaksi TXN-12345 telah dicatat. Struk dikirim ke email pelanggan.
    </p>
  </div>
</div>
```

### 5.2 Error Alert dengan Action
```tsx
<div className={cn(ALERT.base, ALERT.variant.destructive)}>
  <AlertCircle className={cn("size-5 shrink-0", ALERT.icon.destructive)} />
  <div className="flex-1">
    <h4 className={ALERT.title}>Gagal Memuat Data</h4>
    <p className={ALERT.description}>
      Periksa koneksi internet Anda atau coba lagi.
    </p>
    <button onClick={retry} className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline">
      Coba lagi
    </button>
  </div>
</div>
```

### 5.3 Warning Alert dengan Dismissable
```tsx
const [show, setShow] = useState(true);
{show && (
  <div className={cn(ALERT.base, ALERT.variant.warning)}>
    <AlertTriangle className={cn("size-5 shrink-0", ALERT.icon.warning)} />
    <div className="flex-1">
      <h4 className={ALERT.title}>Stok Kertas HVS Menipis</h4>
      <p className={ALERT.description}>
        Sisa 8 rim. Direkomendasikan order ulang dalam 3 hari.
      </p>
    </div>
    <button onClick={() => setShow(false)} className={ALERT.close}>
      <X className="size-4" />
    </button>
  </div>
)}
```

### 5.4 Info Alert (Onboarding Tip)
```tsx
<div className={cn(ALERT.base, ALERT.variant.info)}>
  <Info className={cn("size-5 shrink-0", ALERT.icon.info)} />
  <div className="flex-1">
    <h4 className={ALERT.title}>Tip: Gunakan Shortcut</h4>
    <p className={ALERT.description}>
      Tekan <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-mono text-[10px]">Ctrl + K</kbd> untuk buka command palette.
    </p>
  </div>
</div>
```

### 5.5 Feature Promotion (Primary/Indigo)
```tsx
<div className={cn(ALERT.base, ALERT.variant.primary)}>
  <Sparkles className={cn("size-5 shrink-0", ALERT.icon.primary)} />
  <div className="flex-1">
    <h4 className={ALERT.title}>Fitur Baru: AI Forecasting</h4>
    <p className={ALERT.description}>
      Prediksi stok otomatis kini tersedia di menu Prediksi Stok.
    </p>
    <Link href="/prediksi-stok" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline">
      Coba sekarang <ArrowRight className="size-3" />
    </Link>
  </div>
</div>
```

### 5.6 Compact Alert (`sm` di form)
```tsx
<div className={cn(ALERT.base, ALERT.variant.destructive, ALERT.size.sm)}>
  <AlertCircle className={cn("size-4 shrink-0", ALERT.icon.destructive)} />
  <p className={cn(ALERT.title, "text-xs font-medium")}>
    PIN harus terdiri dari 4-6 digit angka.
  </p>
</div>
```

### 5.7 Form Validation Summary (multi-error)
```tsx
<div className={cn(ALERT.base, ALERT.variant.destructive)}>
  <AlertCircle className={cn("size-5 shrink-0", ALERT.icon.destructive)} />
  <div className="flex-1">
    <h4 className={ALERT.title}>Form belum lengkap</h4>
    <ul className="mt-1.5 text-xs text-rose-700 dark:text-rose-300 list-disc list-inside space-y-0.5">
      <li>Nama produk wajib diisi</li>
      <li>Harga harus lebih dari 0</li>
      <li>SKU sudah terpakai</li>
    </ul>
  </div>
</div>
```

### 5.8 Hero Banner (Page-Top, `lg`)
```tsx
<div className={cn(ALERT.base, ALERT.variant.info, ALERT.size.lg, "mb-6")}>
  <Info className={cn("size-5 shrink-0 mt-0.5", ALERT.icon.info)} />
  <div className="flex-1">
    <h4 className={cn(ALERT.title, "text-base")}>Mode Demo Aktif</h4>
    <p className={cn(ALERT.description, "text-sm")}>
      Data yang Anda lihat adalah sample. Semua perubahan bersifat sementara.
    </p>
  </div>
</div>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Alert tanpa icon | Weak affordance | Always include leading icon |
| Alert tanpa dark mode | Breaks in dark theme | Full `dark:*` pairing via `ALERT.variant.*` |
| Ad-hoc `bg-*-50 border-*-200` | 100+ hand-rolled variance | `ALERT.variant.*` tokens |
| Warna `red-*` untuk error | Wrong palette | `rose-*` via `ALERT.variant.destructive` |
| Warna `green-*` untuk success | Wrong palette | `emerald-*` via `ALERT.variant.success` |
| Alert dengan `p-2` atau `p-1` | Too cramped | `ALERT.size.{sm/md/lg}` |
| Rounded shape (`rounded-full`) | Not pill-shaped | `rounded-xl` |
| Alert tanpa title (description only) | Weak hierarchy | Always include title |
| Multiple primary actions | Decision fatigue | 1 primary + optional secondary |
| Critical error hanya via toast | User may miss | Alert inline di atas form / page |
| Dismissable tapi hilang selamanya (no state persist) | UX fail | Persist dismissed state di localStorage/cookie |
| Nested alert (alert in alert) | Visual chaos | Flatten or separate |

---

## 7. Migration Guide

### 7.1 Token Adoption (Priority #1)
Scan 100+ hand-rolled banners dan refactor:

```diff
- <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-xl p-4 flex items-start gap-3 text-rose-700 dark:text-rose-400">
-   <AlertCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />
-   <div>
-     <h4 className="text-sm font-bold">Gagal</h4>
-     <p className="text-xs mt-0.5">Error message</p>
-   </div>
- </div>
+ <div className={cn(ALERT.base, ALERT.variant.destructive)}>
+   <AlertCircle className={cn("size-5 shrink-0", ALERT.icon.destructive)} />
+   <div className="flex-1">
+     <h4 className={ALERT.title}>Gagal</h4>
+     <p className={ALERT.description}>Error message</p>
+   </div>
+ </div>
```

### 7.2 Dark Mode Fill
Banyak banner hand-rolled missing dark mode — apply via `ALERT.variant.*` langsung complete.

### 7.3 Warna Palette Alignment
- `red-*` → `rose-*` (via `destructive`)
- `green-*` → `emerald-*` (via `success`)
- Stray colors → variant yang appropriate

### Per-page priority
1. **PortalTemplate** — error banner page-level (paling visible)
2. **LaporanPage** — status alerts + transit banners
3. **PengaturanPage** — form validation alerts
4. **InventarisPage** — stock warning banners
5. **PrediksiStokPage** — AI recommendation alerts
6. **CashManagementPage** — warning banners
7. **XAIPage** — explanation banners

### Code Review Rubric
1. Alert tanpa icon? → **reject**
2. Missing dark mode? → **reject**
3. Ad-hoc color (bukan `ALERT.variant.*`)? → **request change**
4. Warna `red-*`/`green-*`? → **request change** (rose/emerald)
5. Critical error hanya via toast? → **request change** (add inline alert)
6. Dismissable tanpa state persist? → **request change**
7. Multiple primary action? → **request change**

---

## 8. Future Enhancements

- [ ] Dedicated `<Alert>` component wrapper (intent={variant} size={sm|md|lg} dismissable)
- [ ] Alert group (stack multiple alerts with animation)
- [ ] Progress alert (upload/download status)
- [ ] Timed auto-dismiss dengan countdown
- [ ] Collapsible long alert (show more / less)
- [ ] Alert with thumbnail/avatar (mention pattern)
- [ ] Persistent dismiss state (localStorage key per alert ID)
- [ ] Storybook page dengan semua variants + sizes

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
