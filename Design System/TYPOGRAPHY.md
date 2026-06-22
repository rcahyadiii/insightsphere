# 🔤 InsightSphere Typography System

> **Single source of truth untuk typography di seluruh aplikasi.**
> Versi: 1.1 — 23 April 2026 (v3 uppercase policy: minimal)
> Implementasi token: `frontend/src/app/lib/typography.ts`

---

## 1. Font Families

Aplikasi ini hanya menggunakan **2 font** yang di-load via `next/font/google` (lihat `frontend/app/layout.tsx`):

| Font | CSS Variable | Tailwind Class | Penggunaan |
|---|---|---|---|
| **Inter** | `--font-inter` | `font-sans` (default body) | Semua teks UI: heading, body, label, button |
| **Fira Code** | `--font-fira-code` | `font-data` (custom utility) | Angka numeric, SKU, ID, kode, timestamp |

**Penting:** Jangan pakai `font-mono` (Tailwind default) — itu akan jatuh ke monospace OS (Consolas / SF Mono) dan **tidak** memuat Fira Code. Selalu gunakan `font-data`.

Definisi `font-data` di `frontend/src/styles/theme.css`:
```css
.font-data {
  font-family: var(--font-fira-code), monospace;
  letter-spacing: -0.02em;
}
```

---

## 2. Design Principles

### 2.1 Weight Hierarchy
Hanya **3 level weight** yang boleh dipakai untuk teks utama:

| Weight | Class | Penggunaan |
|---|---|---|
| **400** Normal | `font-normal` | **Body text default** (most of the UI) |
| **600** Semibold | `font-semibold` | H3, body-emphasis, data-emphasis |
| **900** Black | `font-black` | H1, KPI numbers, strong emphasis |

`font-bold` (700) tetap boleh untuk **label/caption/button/micro** — yaitu teks uppercase kecil yang butuh density. **Tidak boleh** untuk body text.

**Alasan:** Weight inflation (semua teks `font-bold`/`font-black`) menghilangkan hierarki visual dan membuat mata cepat lelah. Body default `font-normal` memberi "ruang istirahat" mata.

### 2.2 Size Scale (Standard Only)
Satu skala dipakai konsisten — tidak boleh ada duplikat antara arbitrary-px dan Tailwind scale.

| Token | Nilai | Penggunaan |
|---|---|---|
| `text-[9px]` | 9px | **A11y floor** — Micro/Caption |
| `text-[10px]` | 10px | Label, Code |
| `text-xs` | 12px | Body-sm, Data-sm |
| `text-sm` | 14px | Body, Data-md |
| `text-base` | 16px | H3 |
| `text-lg` | 18px | H2 |
| `text-2xl` | 24px | H1, KPI-card |
| `text-4xl` | 36px | KPI-hero |

### 2.3 Accessibility Floor
**Minimum font size: 9px.** Tidak ada `text-[7px]` atau `text-[8px]` di codebase.

Status badge, chip, dan micro-label minimum 9px untuk memastikan keterbacaan di layar non-retina dan kondisi cahaya terang (ruang kerja kasir).

### 2.4 Uppercase Policy (Minimal)

Uppercase dipakai **terbatas** karena kurang natural untuk Bahasa Indonesia dan menambah reading fatigue untuk user yang bekerja 8 jam di aplikasi. **Hanya 3 token yang pakai uppercase:**

| Token | Alasan uppercase tetap dipakai |
|---|---|
| `T.h4` | Mini-section divider label (mis. "INFORMASI DASAR") — berfungsi sebagai marker, bukan heading untuk dibaca |
| `T.micro` | Status badge/chip (mis. "AKTIF", "LOW STOCK") — berfungsi sebagai "signal visual", selalu pendek + punya background color |
| `T.code` | SKU/ID/kode (mis. "CF-4X6") — mengikuti konvensi universal kode yang memang uppercase |

**Semua token lain** (H1, H2, H3, Body, Label, Caption, Button, KPI, Data) memakai **Title Case** atau **Sentence Case** agar natural untuk Bahasa Indonesia.

**Pairing rule untuk 3 token uppercase:**
- Selalu dipasangkan dengan `tracking-widest` (0.1em) kecuali `T.code` yang pakai `tracking-tighter` (konvensi SKU).
- **Terlarang:** `tracking-tight` pada teks uppercase lain. Uppercase butuh ruang lebih, bukan lebih sempit.

**Contoh perbedaan:**

| Context | ❌ Hindari | ✅ Pakai |
|---|---|---|
| Label form | `NAMA PRODUK` | `Nama Produk` |
| Caption | `DIPERBARUI 5 MENIT LALU` | `Diperbarui 5 menit lalu` |
| H2 modal | `RINGKASAN HARI INI` | `Ringkasan Hari Ini` |
| Button CTA | `SIMPAN` | `Simpan` |
| Status badge | `Aktif` | `AKTIF` ✅ (keep uppercase) |
| SKU | `Cf-4x6` | `CF-4X6` ✅ (keep uppercase) |

### 2.5 Numeric Data
Angka numeric **selalu** pakai kombinasi:
```
font-data tabular-nums
```
`font-data` = Fira Code (fixed-width numerals).
`tabular-nums` = force tabular figures untuk alignment kolom.

---

## 3. Token Reference

### Headings

| Token | Class | Contoh penggunaan |
|---|---|---|
| `T.h1` | `text-2xl font-black tracking-tight` | Page title: "Dashboard", "Inventaris Produk" |
| `T.h2` | `text-lg font-bold tracking-tight` | Modal title, section header: "Ringkasan Hari Ini" |
| `T.h3` | `text-base font-semibold tracking-tight` | Card header, tab section |
| `T.h4` | `text-xs font-bold uppercase tracking-widest` | Mini divider label: "INFORMASI DASAR" (🔹 uppercase) |

### Body

| Token | Class | Contoh |
|---|---|---|
| `T.body` | `text-sm font-normal` | Paragraf, deskripsi |
| `T.bodySm` | `text-xs font-normal` | Teks pendukung, hint |
| `T.bodyEmphasis` | `text-sm font-semibold` | Penekanan inline ("**penting**") |

### Labels & Captions

| Token | Class | Contoh |
|---|---|---|
| `T.label` | `text-[10px] font-bold` | "Nama Produk", "Status" |
| `T.caption` | `text-[9px] font-medium` | Timestamp "5 menit lalu", sub-label |
| `T.micro` | `text-[9px] font-bold uppercase tracking-widest` | Badge "AKTIF", "LOW STOCK" (🔹 uppercase) |

### KPI / Hero Numbers

| Token | Class | Contoh |
|---|---|---|
| `T.kpiHero` | `text-4xl font-black font-data tabular-nums tracking-tight` | Dashboard hero: "Rp 12.4 Jt" |
| `T.kpiCard` | `text-2xl font-black font-data tabular-nums tracking-tight` | Summary card metric |

### Tabular Data

| Token | Class | Contoh |
|---|---|---|
| `T.dataMd` | `text-sm font-normal font-data tabular-nums` | Cell angka di tabel |
| `T.dataSm` | `text-xs font-normal font-data tabular-nums` | Inline data |
| `T.dataEmphasis` | `text-sm font-semibold font-data tabular-nums` | Baris total, highlight |

### Code / Identifiers

| Token | Class | Contoh |
|---|---|---|
| `T.code` | `text-[10px] font-medium font-data uppercase tracking-tighter` | SKU "CF-4X6", TX ID "TRX-001" (🔹 uppercase) |

### Buttons

| Token | Class | Contoh |
|---|---|---|
| `T.buttonLg` | `text-sm font-bold tracking-tight` | Primary CTA: "Simpan", "Tambah Produk" |
| `T.buttonSm` | `text-xs font-bold tracking-tight` | Secondary: "Batal", "Export" |

---

## 4. Usage Examples

### Import & pakai dengan `cn()`

```tsx
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";

export function ProductCard({ product }) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800">
      <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 mb-2")}>
        {product.name}
      </h3>
      <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400 mb-3")}>
        {product.description}
      </p>
      <div className="flex items-center justify-between">
        <span className={cn(T.code, "text-slate-400")}>{product.sku}</span>
        <span className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>
          Rp {product.price.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
```

### Kombinasi dengan dark mode & color

Token **hanya** mengandung properti size / weight / family / tracking. Warna selalu ditambahkan lewat `cn()`:

```tsx
<h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
<span className={cn(T.micro, "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded")}>
```

---

## 5. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `text-[7px]`, `text-[8px]` | A11y violation (< 9px floor) | `text-[9px]` |
| `text-[11px]` | 1px off `text-xs` — tidak konsisten | `text-xs` |
| `text-[12px]` | Duplikat `text-xs` | `text-xs` |
| `text-[13px]` | Duplikat `text-sm` | `text-sm` |
| `font-mono` | Tidak memuat Fira Code | `font-data` |
| `font-extrabold` | Redundant antara bold (700) & black (900) | `font-black` |
| Body text `font-bold` | Weight inflation | `font-normal` atau `T.body` |
| `uppercase` di luar H4/Micro/Code | Bahasa Indonesia kurang natural uppercase | Title Case / Sentence Case |
| `tracking-tight` pada uppercase H4/Micro/Code | Uppercase butuh space lebih | `tracking-widest` (kecuali Code pakai `tracking-tighter`) |

---

## 6. Migration Guide (Existing Pages)

Refactor halaman existing **incremental per halaman** (bukan global search-replace). Urutan prioritas:

1. **DashboardPage** — traffic tertinggi, paling terlihat
2. **KasirPage** + POS components — UX-critical untuk daily use
3. **InventarisPage** + inventory modals — data-heavy
4. **TransactionHistoryPage** — tabel numeric
5. **LaporanPage**, **XAIPage**, **PrediksiStokPage** — analytics
6. **CashManagementPage**, **StockMovementPage** — operasional
7. **UserManagementPage**, **PengaturanPage**, **UserProfilePage** — settings
8. **MLOpsDashboardPage** — technical
9. **Shared components** (Header, Sidebar, modals, charts)

### Checklist per halaman

Per halaman, pastikan:

- [ ] Ganti `font-mono` → `font-data` (jika ada)
- [ ] Ganti `text-[7px]` dan `text-[8px]` → `text-[9px]`
- [ ] Ganti `text-[11px]`/`text-[12px]`/`text-[13px]` → `text-xs` / `text-sm`
- [ ] Ganti `font-extrabold` → `font-black`
- [ ] Review `font-bold` di body text → `font-normal` (jika bukan emphasis)
- [ ] **Hapus `uppercase` dari label/caption/button/H2** — ganti teksnya ke Title Case ("NAMA PRODUK" → "Nama Produk", "SIMPAN" → "Simpan")
- [ ] **Pertahankan `uppercase` hanya di H4 divider, status badge (Micro), dan SKU/ID (Code)**
- [ ] KPI value → gunakan `T.kpiHero` atau `T.kpiCard`, bukan `text-xl`
- [ ] H3 → `text-base` (bukan `text-sm`) agar terpisah dari body
- [ ] Refactor ke import `T` tokens dari `@/app/lib/typography` untuk konsistensi

### Code review rubric

Saat review PR typography-related, cek:

1. Ada `font-mono`? → reject
2. Ada `text-[8px]` atau lebih kecil? → reject (kecuali ada justifikasi a11y exemption)
3. Body text `font-bold`/`font-black` tanpa alasan emphasis? → request change
4. Uppercase di luar 3 token (H4/Micro/Code)? → request change — ganti ke Title Case
5. Uppercase + `tracking-tight` atau `tracking-normal`? → reject (uppercase butuh `tracking-widest`)
6. Angka tanpa `font-data tabular-nums`? → request change

---

## 7. Future Enhancements

- [ ] Buat ESLint custom rule untuk reject banned patterns
- [ ] Buat Storybook page dengan live preview setiap token
- [ ] Pertimbangkan `font-variant-numeric: oldstyle-nums` untuk display text (non-data)
- [ ] Tambah token `T.displayXl` untuk hero landing page (jika ada onboarding)

---

**Design review oleh:** faiz
**Implementasi:** 23 April 2026
