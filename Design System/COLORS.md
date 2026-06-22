# 🎨 InsightSphere Color System

> **Single source of truth untuk warna di seluruh aplikasi.**
> Versi: 1.1 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/colors.ts`
> CSS variables: `frontend/src/styles/theme.css`

**Changelog v1.1 (23 Apr 2026):**
- Extended palette dari **6 families → 8 families**.
- Added 2 extended semantic families: `blue` (info), `violet` (ai/predictive).
- Updated banned list (removed blue/violet — now allowed untuk specific purposes).
- Aligned dengan current token usage di `data.ts`, `feedback.ts`, `nav.ts`, `charts.ts`.

---

## 1. Palette Overview

InsightSphere memakai **8 color families**: 5 core + 2 extended + 1 role accent.

### 1.1 Core Families (5)

Digunakan untuk setiap komponen UI standar:

| Semantic | Family (Tailwind) | Hex (600) | Dipakai untuk |
|---|---|---|---|
| **Neutral** | `slate` | #475569 | UI chrome, text, borders, retur movement |
| **Primary / Brand** | `indigo` | #4f46e5 | CTA, brand accent, owner role |
| **Success** | `emerald` | #059669 | Revenue, growth, confirmed, cashier role |
| **Warning** | `amber` | #d97706 | Low stock, pending, in-transit, attention |
| **Destructive** | `rose` | #e11d48 | Errors, delete, admin role |

### 1.2 Extended Families (2 — specific purposes only)

Family tambahan untuk kebutuhan spesifik (tidak overlap dengan core):

| Semantic | Family (Tailwind) | Hex (600) | Dipakai untuk |
|---|---|---|---|
| **Info** | `blue` | #2563eb | Informational banners, neutral notifications, "did you know" hints. **Distinct dari primary indigo** — info adalah passive, primary adalah action. |
| **AI / Predictive** | `violet` | #7c3aed | AI forecasting UI, XAI explanations, ML-generated content, predictive insights. **Dedicated branding untuk AI-driven features.** |

**Kapan pakai `indigo` vs `blue`?**
- `indigo` (primary) → interactive CTA, clickable brand-accent elements.
- `blue` (info) → informational/passive content (alert info, help text banner).

**Kapan pakai `indigo` vs `violet`?**
- `indigo` (primary) → main business flow (save, submit, checkout).
- `violet` (ai) → AI feature branding (forecast, recommendation, explanation).

### 1.3 Role Accent (1 — reserved exception)

| Semantic | Family (Tailwind) | Hex (600) | Dipakai untuk |
|---|---|---|---|
| **Inventory Accent** | `teal` | #0d9488 | **Hanya** untuk `inventory_manager` role badge, avatar, sidebar chrome. Tidak untuk UI umum. |

---

## 2. Design Principles

### 2.1 Closed Palette
Hanya **8 color families** di atas yang **diizinkan**. Selain itu dilarang:

❌ `red`, `orange`, `yellow`, `lime`, `green`, `cyan`, `sky`, `purple`, `fuchsia`, `pink`

Semua harus dimapping ke 8 allowed families. Mapping rekomendasi:

| Banned | → Replace With | Reason |
|---|---|---|
| `text-red-*` | `text-rose-*` | destructive / error |
| `bg-orange-*` | `bg-amber-*` | warning / pending |
| `bg-yellow-*` | `bg-amber-*` | warning |
| `bg-lime-*` | `bg-emerald-*` | success |
| `bg-green-*` | `bg-emerald-*` | success |
| `bg-cyan-*` | `bg-blue-*` (info) atau `bg-teal-*` (inventory) | context-dependent |
| `bg-sky-*` | `bg-blue-*` (info) atau `bg-indigo-*` (primary) | context-dependent |
| `bg-purple-*` | `bg-violet-*` | ai/predictive |
| `bg-fuchsia-*` | `bg-rose-*` | destructive |
| `bg-pink-*` | `bg-rose-*` | destructive |

### 2.2 Dark Mode Pairing Rule

Setiap color class **wajib** punya dark mode counterpart:

| Light | Dark |
|---|---|
| `{color}-50` | `{color}-900/30` |
| `{color}-100` | `{color}-900/40` |
| `{color}-200` | `{color}-800/50` |
| `{color}-300` | `{color}-700` |
| `{color}-400` | `{color}-500` |
| `{color}-500` | `{color}-500` (same) |
| `{color}-600` | `{color}-400` |
| `{color}-700` | `{color}-400` |

Pattern ini didasarkan pada analisis 28% kode existing yang sudah punya dark mode variant — tinggal dikonsistenkan ke 100%.

### 2.3 Accessibility
- **Foreground**: `slate-900` (#0f172a), **bukan** pure black (#000000).
- **Muted foreground**: `slate-600` (light) / `slate-400` (dark).
- **Contrast ratio**: semua kombinasi text + bg minimum 4.5:1 (WCAG AA).

### 2.4 Semantic Clarity
Tidak boleh pakai warna "artistik" — setiap warna harus punya arti semantic:
- ✅ `emerald` = positive outcome (payment received, transaction successful)
- ❌ `emerald` = "warnanya bagus aja" (arbitrary)

### 2.5 Extended Family Discipline
`blue` dan `violet` adalah **extended family** dengan scope sempit:

- `blue` hanya untuk **info** role. JANGAN pakai untuk CTA, link hover, chart series umum. Prefer `indigo`.
- `violet` hanya untuk **AI** context. JANGAN pakai untuk decorative purposes. Prefer `indigo`.
- `teal` hanya untuk **inventory_manager** role identity. JANGAN pakai untuk general success. Prefer `emerald`.

Boundaries ini mencegah palette dilution — setiap family punya semantic tunggal yang clear.

---

## 3. Token Reference

### 3.1 Struktur Token (TypeScript)

Setiap semantic punya **7 sub-variants**:

```ts
C.success = {
  bg: "bg-emerald-50 dark:bg-emerald-900/30",        // Soft background
  text: "text-emerald-700 dark:text-emerald-400",    // Text pada soft bg
  border: "border-emerald-200 dark:border-emerald-800/50",
  solid: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  solidText: "text-white",                            // Text pada solid bg
  icon: "text-emerald-500 dark:text-emerald-400",     // Icon accent
  ring: "ring-emerald-400 dark:ring-emerald-500",     // Focus ring
}
```

### 3.2 Available Tokens

**Semantic tokens:**
- `C.primary` — indigo (CTA, brand)
- `C.success` — emerald (positive)
- `C.warning` — amber (attention)
- `C.destructive` — rose (error)
- `C.neutral` — slate (chrome, neutral)

**Role tokens** (subset — `avatar`, `badge`, `solid`):
- `C.roleOwner` — indigo
- `C.roleAdmin` — rose
- `C.roleCashier` — emerald
- `C.roleInventory` — teal (satu-satunya tempat teal diizinkan)

### 3.3 CSS Variables (untuk shadcn components)

Tersedia di `theme.css`:

```css
/* Light */
--primary, --primary-foreground
--destructive, --destructive-foreground
--success, --success-foreground
--warning, --warning-foreground
--info, --info-foreground
--ai-primary, --ai-foreground
--role-inventory, --role-inventory-foreground

/* Tailwind v4 mapping (@theme inline) */
--color-primary, --color-success, --color-warning, --color-destructive, --color-info, --color-ai, --color-role-inventory
```

Bisa dipakai sebagai `bg-success` (shadcn-style) di komponen baru.

---

## 4. Usage Examples

### 4.1 Soft Badge (status chip)

```tsx
import { C } from "@/app/lib/colors";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";

<span className={cn(
  C.success.bg, C.success.text, C.success.border,
  T.micro, "px-2 py-0.5 rounded-full border"
)}>
  AKTIF
</span>
```

### 4.2 Solid Button

```tsx
<button className={cn(
  C.primary.solid, C.primary.solidText,
  T.buttonLg, "px-4 py-2.5 rounded-xl"
)}>
  Simpan
</button>
```

### 4.3 Icon dengan Accent

```tsx
import { CheckCircle2 } from "lucide-react";

<CheckCircle2 className={cn(C.success.icon, "w-5 h-5")} />
```

### 4.4 Role Avatar

```tsx
const roleToken = {
  owner: C.roleOwner,
  admin: C.roleAdmin,
  cashier: C.roleCashier,
  inventory_manager: C.roleInventory,
}[user.role];

<div className={cn(roleToken.avatar, "w-10 h-10 rounded-xl border flex items-center justify-center")}>
  <UserIcon className="w-5 h-5" />
</div>
```

### 4.5 Role Badge

```tsx
<span className={cn(roleToken.badge, T.micro, "px-2 py-0.5 rounded-full border")}>
  {roleLabel}
</span>
```

### 4.6 Validation Error Box

```tsx
<div className={cn(
  C.destructive.bg, C.destructive.text, C.destructive.border,
  "flex items-start gap-2 p-3 rounded-xl border"
)}>
  <AlertCircle className={cn(C.destructive.icon, "w-4 h-4 mt-0.5")} />
  <p className={T.bodySm}>Username atau password salah.</p>
</div>
```

---

## 5. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `text-red-*`, `bg-red-*` | Use `rose` (destructive) | `C.destructive.*` atau `text-rose-*` |
| `text-orange-*`, `from-orange-*` | Use `amber` (warning) | `C.warning.*` atau `text-amber-*` |
| `text-blue-*`, `bg-blue-*` | Use `amber` (in-progress) / `indigo` | `C.warning.*` / `C.primary.*` |
| `text-purple-*`, `from-purple-*` | Use `slate` / `indigo` | `C.neutral.*` / `C.primary.*` |
| `from-teal-*` (gradient) | `teal` only for `inventory_manager` badge | `from-emerald-*` |
| Color without dark variant | Must have `dark:` counterpart | Follow dark mode pairing rule §2.2 |
| `--foreground: #000` (pure black) | A11y too harsh | Use `slate-900` (#0f172a) |
| Arbitrary hex (`#10b981`) in TSX | Use Tailwind class or CSS var | `text-emerald-500` or `text-[var(--success)]` |

---

## 6. Migration Guide (Existing Pages)

Refactor halaman existing **incremental per halaman**, bukan global search-replace. Urutan prioritas sesuai traffic:

1. **DashboardPage** — traffic tertinggi
2. **KasirPage** + POS components
3. **InventarisPage** + inventory modals
4. **TransactionHistoryPage**
5. **LaporanPage**, **XAIPage**, **PrediksiStokPage**
6. **CashManagementPage**, **StockMovementPage**
7. **UserManagementPage**, **PengaturanPage**, **UserProfilePage**
8. **MLOpsDashboardPage**
9. **Shared components** (Header, Sidebar, modals, charts)

### Checklist per halaman

- [ ] Cek ada pemakaian family terlarang (`red`/`orange`/`blue`/`purple`/dst) → map ke 5 semantic families
- [ ] Setiap color class punya dark mode counterpart? Tambah jika belum
- [ ] Ada arbitrary hex di TSX (`#10b981`, `rgb(...)`)? Ganti dengan Tailwind class
- [ ] Ada pure black `text-black` / `#000`? Ganti ke `text-slate-900` / `#0f172a`
- [ ] Optional: refactor ke `C.*` tokens untuk konsistensi

### Code review rubric

1. Ada color family di luar 6 yang diizinkan? → **reject** kecuali dalam konteks `roleInventory`
2. Color class tanpa `dark:` variant? → **request change** (kecuali ada alasan)
3. Pure black `#000` / `text-black`? → **reject**, pakai `slate-900`
4. Hex literal di TSX? → **reject**, pakai Tailwind class atau CSS var
5. Pemakaian semantic yang aneh (misal `rose` untuk success, `emerald` untuk error)? → **reject**

---

## 7. Future Enhancements

- [ ] ESLint custom rule untuk reject banned color families
- [ ] Storybook page dengan live preview setiap token + semantic context
- [ ] Auto-fix tool: scan codebase, tambahkan dark mode counterpart otomatis berdasarkan pairing rule
- [ ] Tambah `C.info` untuk kasus informational yang butuh warna terpisah dari `primary`
- [ ] Consider chart color palette (Recharts) — perlu distinct qualitative palette untuk 5-8 kategori

---

**Design review oleh:** faiz
**Implementasi:** 23 April 2026
