# 🔔 InsightSphere Toast System

> **Single source of truth untuk toast notifications (sonner).**
> Versi: 1.0 — 23 April 2026
> Implementasi: `frontend/src/app/components/ui/sonner.tsx` (shadcn wrapper) + `sonner` package
> Companion specs: `ALERTS.md`, `COLORS.md`, `MOTION.md`

---

## 1. Overview

InsightSphere pakai **`sonner`** (shadcn-integrated) sebagai toast library. Audit menemukan **42+ `toast.*` calls di 14 file**. Top users:
- CashManagementPage (7)
- InventarisPage (5)
- UserManagementPage (4)
- UserProfilePage (4)
- useCheckout hook (4)
- PortalTemplate (3)
- DashboardPage (3)
- LaporanPage (3)

**Infrastructure:** `<Toaster>` sudah di-mount di `components/ui/sonner.tsx` dan include di layout root.

Policy ini memformalkan duration tiers, position, variant semantic, dan integration pattern.

---

## 2. Toast vs Alert (Recap)

Ref: `ALERTS.md §2`

| Aspect | Toast (this doc) | Alert |
|---|---|---|
| **Duration** | Auto-dismiss ~3s | Stays until dismissed |
| **Placement** | Floating (top-right desktop) | Inline di page/card/modal |
| **Importance** | Confirmation, quick feedback | Critical info, form errors |
| **User action** | Passive | Must acknowledge |

**Rule ulang:** Jangan pakai toast untuk critical error yang user **harus** action. Pakai alert inline.

---

## 3. Design Principles

### 3.1 6 Toast Variants
Sonner built-in methods:
```tsx
toast.success("Pembayaran berhasil")
toast.error("Gagal menyimpan")
toast.warning("Stok menipis")
toast.info("Silakan cek email Anda")
toast.loading("Memproses transaksi...")
toast.promise(asyncFn, { loading, success, error })
```

| Variant | Icon | Use case |
|---|---|---|
| `success` | ✓ | Action completed (save, pay, delete confirmed) |
| `error` | ✕ | Action failed (network error, validation) |
| `warning` | ⚠ | Non-blocking caution (low stock) |
| `info` | ℹ | Neutral notification |
| `loading` | ⟳ | In-progress (long async — >1s) |
| `promise` | auto | Async wrapper (loading → success/error) |

### 3.2 Duration Tiers
| Tier | Duration | Use |
|:---:|:---:|---|
| `fast` | `2000ms` | Simple confirmation ("Tersalin ke clipboard") |
| **`normal`** | **`3000ms`** | **Default** — success, info, warning |
| `slow` | `5000ms` | Error (user needs time to read) |
| `persistent` | `Infinity` | Critical — user must dismiss |

### 3.3 Position
| Screen | Position |
|---|---|
| Desktop (≥768px) | `top-right` |
| Mobile (<768px) | `top-center` |

Sonner default = `top-right`. Override di `<Toaster position="top-right" />`.

### 3.4 Max Stack = 3
Jangan biarkan toast menumpuk > 3 sekaligus. Sonner auto-collapse ke stack.

### 3.5 Icon Match Variant (Auto by Sonner)
Sonner auto-inject icon per variant. Jangan override kecuali ada keperluan custom (mis. emoji untuk onboarding).

### 3.6 Text Guidelines (Bahasa Indonesia)
| Variant | Template |
|---|---|
| success | "{entity} berhasil {action}" — "Produk berhasil ditambahkan" |
| error | "Gagal {action}. {reason}" — "Gagal menyimpan. Cek koneksi." |
| warning | "{entity} {warn}. {suggestion}" — "Stok menipis. Order ulang segera." |
| info | "{info}" — "Email verifikasi dikirim." |
| loading | "Sedang {action}..." — "Sedang memproses..." |

**Avoid:**
- All-caps toast text
- Techno jargon ("HTTP 500 Internal Server Error")
- >100 chars (terlalu panjang untuk quick glance)

---

## 4. Usage Examples

### 4.1 Basic Variants
```tsx
import { toast } from "sonner";

// Success
toast.success("Produk berhasil ditambahkan");

// Error
toast.error("Gagal menyimpan produk", {
  description: "Periksa koneksi internet Anda.",
});

// Warning
toast.warning("Stok Kertas HVS menipis", {
  description: "Sisa 8 rim. Order ulang dalam 3 hari.",
});

// Info
toast.info("Email verifikasi telah dikirim");

// Loading (manual control)
const toastId = toast.loading("Memproses transaksi...");
// Later:
toast.success("Transaksi berhasil", { id: toastId });
// atau:
toast.dismiss(toastId);
```

### 4.2 Promise Pattern (Async) — Recommended
```tsx
toast.promise(
  saveProduct(data),
  {
    loading: "Menyimpan produk...",
    success: "Produk berhasil disimpan",
    error: (err) => `Gagal menyimpan: ${err.message}`,
  }
);
```

### 4.3 Toast with Custom Duration
```tsx
toast.success("Produk berhasil ditambahkan", {
  duration: 2000,   // fast tier
});

toast.error("Koneksi gagal", {
  duration: 5000,   // slow tier (error)
});

toast.warning("Backup pending", {
  duration: Infinity,   // persistent
});
```

### 4.4 Toast with Action Button
```tsx
toast.success("Produk dihapus", {
  action: {
    label: "Urungkan",
    onClick: () => undoDelete(),
  },
});
```

### 4.5 Toast with Description (2-line)
```tsx
toast("Pembayaran diproses", {
  description: "Transaksi TXN-12345 akan selesai dalam beberapa detik.",
});
```

### 4.6 Custom Toast dengan JSX
```tsx
toast.custom((t) => (
  <div className={cn(ALERT.base, ALERT.variant.primary, "shadow-lg")}>
    <Sparkles className={cn("size-5 shrink-0", ALERT.icon.primary)} />
    <div className="flex-1">
      <h4 className={ALERT.title}>Fitur Baru!</h4>
      <p className={ALERT.description}>AI Forecasting sudah tersedia.</p>
    </div>
    <button onClick={() => toast.dismiss(t)} className={ALERT.close}>
      <X className="size-4" />
    </button>
  </div>
));
```

---

## 5. Integration Patterns

### 5.1 After API Call
```tsx
async function handleSave() {
  try {
    await api.save(data);
    toast.success("Data tersimpan");
  } catch (err) {
    toast.error("Gagal menyimpan", {
      description: err.message,
    });
  }
}
```

### 5.2 Form Submit (Promise)
```tsx
const handleSubmit = (data: FormData) => {
  toast.promise(api.submitForm(data), {
    loading: "Mengirim...",
    success: "Form terkirim!",
    error: "Gagal mengirim form",
  });
};
```

### 5.3 Destructive Confirmation Flow
```tsx
// 1. Modal confirm (see MODALS.md §4.2)
// 2. After confirm, run action + toast
async function handleDelete(id: string) {
  await api.delete(id);
  toast.success("Produk dihapus", {
    action: {
      label: "Urungkan",
      onClick: () => api.restore(id),
    },
  });
}
```

### 5.4 Non-blocking Validation (Soft Warn)
```tsx
if (stock < 10) {
  toast.warning(`Stok rendah (${stock} unit)`, {
    description: "Pertimbangkan untuk restock segera.",
  });
}
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Toast untuk critical error yang user harus action | User may miss | Alert inline + toast |
| Toast persistent tanpa reason | User confusion | Default `3000ms` |
| Multiple toast for 1 action | Spam | 1 toast per action outcome |
| Toast untuk inline form validation | Wrong UX pattern | Field-level error text |
| Toast text > 100 chars | Can't read in 3s | Split to title + description |
| All-caps toast text | Aggressive, hard to read | Sentence case |
| Technical error message | Not user-friendly | Translated/contextual message |
| Custom position per toast | Inconsistency | Global position via `<Toaster>` |
| Toast setelah page unmount (stale) | Ghost toasts | Proper cleanup (dismiss on unmount) |
| `toast.loading()` tanpa resolution | Stuck indefinite loading | Always resolve with success/error |
| Success toast tanpa actual success | Misleading | Only fire after confirmed success |
| Generic message ("Success!", "Error!") | No context | Specific entity + action |

---

## 7. `<Toaster>` Configuration

### 7.1 Current Setup
File: `components/ui/sonner.tsx`

**Rekomendasi config** (to be applied):
```tsx
<Toaster
  position="top-right"
  richColors
  closeButton
  duration={3000}
  expand={false}
  visibleToasts={3}
  toastOptions={{
    classNames: {
      toast: "rounded-xl",
      success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/50",
      error: "bg-rose-50 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800/50",
      warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800/50",
      info: "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800/50",
    },
  }}
/>
```

---

## 8. Migration Guide

### 8.1 Consolidate toast calls
Scan 42 toast.* calls untuk:
- Gunakan `toast.promise` untuk async actions (currently mixed with manual loading/success chain)
- Unify message templates per variant (Bahasa Indonesia)
- Tambah `description` untuk context jika message panjang

### 8.2 Config `<Toaster>` dengan richColors
Di `components/ui/sonner.tsx`, pastikan `richColors` enabled + dark mode class override.

### 8.3 Replace generic messages
```diff
- toast.success("Success!");
+ toast.success("Produk berhasil ditambahkan");

- toast.error("Error!");
+ toast.error("Gagal menyimpan", { description: err.message });
```

### Per-page priority
1. **useCheckout hook** — 4 toast calls (POS flow)
2. **CashManagementPage** — 7 calls (transaksi operations)
3. **InventarisPage** — 5 calls (product CRUD)
4. **UserManagementPage** — 4 calls (user CRUD)
5. **UserProfilePage** — 4 calls (profile updates)

### Code Review Rubric
1. Generic message (bukan specific)? → **request change**
2. Critical error **hanya** via toast? → **request change** (add alert inline)
3. `toast.loading()` tanpa cleanup? → **reject**
4. All-caps text? → **request change**
5. Toast > 100 chars tanpa description? → **request change**
6. Missing promise pattern untuk async? → **request change**
7. Custom position per toast? → **request change** (global config)

---

## 9. Future Enhancements

- [ ] Custom toast wrapper `notify.success(entity, action)` untuk i18n template
- [ ] Sound notification untuk critical toast (optional, user pref)
- [ ] Action button dengan async handler + toast chain
- [ ] Undo toast pattern dengan countdown visual
- [ ] Group toasts per entity (avoid spam)
- [ ] Toast replay / history (ctrl+shift+t?)
- [ ] Storybook dengan all 6 variants + durations

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
