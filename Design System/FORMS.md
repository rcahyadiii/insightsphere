# 📝 InsightSphere Form System

> **Single source of truth untuk form controls dan validation patterns.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/forms.ts`
> Companion specs: `TYPOGRAPHY.md`, `COLORS.md`, `BUTTONS.md`, `RADII.md`, `SPACING.md`

---

## 1. Overview

InsightSphere punya ~90 form controls (60 input, 10 select, 3 textarea, 2 checkbox, 3 radio, 2 switch). Audit menemukan 7 issue utama:

1. **Focus ring variance** — 4 width berbeda (0/1/2/4), mix `focus:ring-*` vs `focus-visible:ring-*`
2. **Dark mode gap** — 11 input missing `dark:border-slate-700`
3. **Legacy radius** — 12 input pakai `rounded-lg`/`rounded-md` (harus `rounded-xl` per `RADII.md`)
4. **Placeholder variance** — 3 warna (slate-300/400/600)
5. **Disabled inconsistency** — opacity tanpa cursor (or vice versa)
6. **No standard label/helper/error system**
7. **No Field wrapper pattern**

Dominant pattern yang sudah established:
- `border-slate-200 dark:border-slate-700 rounded-xl` × 44 ✅
- `border-rose-*` untuk error × 71 + `text-rose-*` × 142 ✅
- `focus:border-indigo` × 61 ✅

---

## 2. Design Principles

### 2.1 Field Anatomy (Wrapper Pattern)
Setiap form field **wajib** terdiri dari 3-4 bagian:
```
┌─────────────────────────────┐
│ Label (required?)           │  ← text-xs font-bold
├─────────────────────────────┤
│ [Control]                   │  ← input/select/textarea/etc.
├─────────────────────────────┤
│ Helper text atau            │  ← text-xs slate-500 (default)
│ Error text (if invalid)     │  ← text-xs rose-600
└─────────────────────────────┘
```

Gap antar bagian: `space-y-1.5` (6px).

### 2.2 Focus Standard (Unified)
Semua interactive form control pakai **1 focus pattern**:
```
focus:outline-none
focus:border-indigo-500
focus-visible:ring-2 focus-visible:ring-indigo-500/20
```
- `focus:outline-none` — remove browser default
- `focus:border-indigo-500` — border color change (61 instances confirm this pattern)
- `focus-visible:ring-2 focus-visible:ring-indigo-500/20` — subtle ring **only** on keyboard focus (a11y)

**TIDAK pakai:**
- `focus:ring-4` (too aggressive)
- `focus:ring-1` (too subtle)
- `focus:ring-0` (loses a11y)

### 2.3 Dark Mode Parity (Wajib)
Setiap form control **wajib** punya dark mode counterpart:
- `border-slate-200` → `dark:border-slate-700`
- `bg-white` → `dark:bg-slate-900`
- `text-slate-900` → `dark:text-slate-100`
- `placeholder:text-slate-400` → `dark:placeholder:text-slate-500`

### 2.4 Radius Policy
Dari `RADII.md`:
- **Form controls** (input, select, textarea, button): `rounded-xl` (12px) — via `--radius-input`
- **Checkbox**: `rounded` (4px)
- **Radio**: `rounded-full`
- **Switch track**: `rounded-full`

❌ `rounded-lg`, `rounded-md`, `rounded-sm` untuk input = legacy, migrate ke `rounded-xl`.

### 2.5 Size Tiers (3 tiers)
| Tier | Height | Padding | Text | Use case |
|:---:|:---:|:---:|:---:|---|
| `sm` | `h-9` (36px) | `px-3` | `text-xs` | Compact forms, inline filters |
| **`md`** | **`h-10` (40px)** | **`px-4`** | **`text-sm`** | **Default** |
| `lg` | `h-11` (44px) | `px-4` | `text-sm` | Primary CTA forms, login |

Minimum 36px untuk touch target (mobile a11y).

### 2.6 State Matrix
| State | Visual |
|---|---|
| **Default** | `border-slate-200` |
| **Focus** | `border-indigo-500` + ring |
| **Error** | `border-rose-500` + error text |
| **Success** | `border-emerald-500` (optional, jarang dipakai) |
| **Disabled** | `opacity-50` + `cursor-not-allowed` + `bg-slate-50` |
| **Readonly** | `bg-slate-50` + same border (no opacity) |
| **Loading** | Spinner icon inside + `disabled` |

### 2.7 Placeholder Policy
**Hanya 1 warna** untuk placeholder:
- Light: `placeholder:text-slate-400`
- Dark: `dark:placeholder:text-slate-500`

Placeholder **bukan pengganti label**. Label harus selalu visible (a11y).

### 2.8 Disabled Policy (Paired)
Disabled state **wajib** pairing `opacity` + `cursor`:
```
disabled:opacity-50 disabled:cursor-not-allowed
```
Plus optional `disabled:bg-slate-50 dark:disabled:bg-slate-800` untuk visual distinction.

---

## 3. Field Wrapper (FIELD)

### 3.1 Stacked (default — label above control)
```tsx
<div className={FIELD.wrapper}>
  <label className={LABEL.base} htmlFor="email">Email</label>
  <input id="email" type="email" className={cn(INPUT.base, INPUT.size.md)} />
  <p className={HELPER.base}>Email kerja untuk notifikasi.</p>
</div>
```

### 3.2 Inline (checkbox/radio/switch)
```tsx
<label className={FIELD.inline}>
  <input type="checkbox" className={CHECKBOX.base} />
  <span className="text-sm">Ingatkan saya setiap 7 hari</span>
</label>
```

### 3.3 Required / Optional Indicator
```tsx
{/* Required: auto-append red asterisk */}
<label className={cn(LABEL.base, LABEL.required)}>Nama Produk</label>

{/* Optional: muted "(opsional)" */}
<label className={cn(LABEL.base, LABEL.optional)}>SKU</label>
```

---

## 4. Controls

### 4.1 Input (text, email, password, number, tel, search, url)

```tsx
<input
  type="text"
  placeholder="Masukkan nama..."
  className={cn(INPUT.base, INPUT.size.md)}
/>
```

**Dengan icon:**
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
  <input
    type="search"
    className={cn(INPUT.base, INPUT.size.md, "pl-10")}
    placeholder="Cari produk..."
  />
</div>
```

**Dengan prefix/suffix:**
```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
  <input type="number" className={cn(INPUT.base, INPUT.size.md, "pl-10")} />
</div>
```

### 4.2 Textarea
```tsx
<textarea
  className={cn(TEXTAREA.base, TEXTAREA.size.md, TEXTAREA.resize)}
  placeholder="Catatan..."
  rows={4}
/>
```

### 4.3 Select (Native)
```tsx
<div className="relative">
  <select className={cn(SELECT.base, SELECT.size.md, "appearance-none pr-10")}>
    <option>Pilih kategori</option>
    <option value="print">Print</option>
    <option value="foto">Cetak Foto</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none text-slate-400" />
</div>
```

### 4.4 Select (shadcn `<Select>`)
```tsx
<Select>
  <SelectTrigger className={cn(SELECT.base, SELECT.size.md)}>
    <SelectValue placeholder="Pilih kategori" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="print">Print</SelectItem>
  </SelectContent>
</Select>
```

### 4.5 Checkbox
```tsx
<label className={FIELD.inline}>
  <input type="checkbox" className={CHECKBOX.base} />
  <span className="text-sm">Aktifkan stok minimum</span>
</label>
```

### 4.6 Radio Group
```tsx
<fieldset className="space-y-2">
  <legend className={LABEL.base}>Metode Pembayaran</legend>
  <label className={FIELD.inline}>
    <input type="radio" name="payment" value="cash" className={RADIO.base} />
    <span className="text-sm">Tunai</span>
  </label>
  <label className={FIELD.inline}>
    <input type="radio" name="payment" value="qris" className={RADIO.base} />
    <span className="text-sm">QRIS</span>
  </label>
</fieldset>
```

### 4.7 Switch (custom or shadcn)
```tsx
<label className={FIELD.inline}>
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={() => setEnabled(!enabled)}
    className={cn(SWITCH.base, enabled ? SWITCH.on : SWITCH.off)}
  >
    <span className={cn(SWITCH.thumb, enabled ? SWITCH.thumbOn : SWITCH.thumbOff)} />
  </button>
  <span className="text-sm">Notifikasi push</span>
</label>
```

---

## 5. Validation States

### 5.1 Error State (most common)
```tsx
<div className={FIELD.wrapper}>
  <label className={cn(LABEL.base, LABEL.required)}>Harga</label>
  <input
    type="number"
    className={cn(INPUT.base, INPUT.size.md, INPUT.error)}
    aria-invalid="true"
    aria-describedby="price-error"
  />
  <p id="price-error" className={ERROR_TEXT.withIcon}>
    <AlertCircle className="size-3 shrink-0" />
    Harga harus lebih dari 0
  </p>
</div>
```

### 5.2 Success State (optional, rare use)
```tsx
<input className={cn(INPUT.base, INPUT.size.md, INPUT.success)} />
<p className="text-xs text-emerald-600 dark:text-emerald-400">
  <Check className="inline size-3" /> SKU tersedia
</p>
```

### 5.3 Loading State
```tsx
<div className="relative">
  <input disabled className={cn(INPUT.base, INPUT.size.md, "pr-10")} />
  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-slate-400" />
</div>
```

### 5.4 Readonly State
```tsx
<input
  readOnly
  value="AUTO-GENERATED"
  className={cn(INPUT.base, INPUT.size.md, "bg-slate-50 dark:bg-slate-800 text-slate-500")}
/>
```

---

## 6. Complete Form Examples

### 6.1 Login Form
```tsx
<form className="space-y-4">
  <div className={FIELD.wrapper}>
    <label className={cn(LABEL.base, LABEL.required)}>Username</label>
    <input type="text" className={cn(INPUT.base, INPUT.size.lg)} placeholder="Masukkan username" />
  </div>

  <div className={FIELD.wrapper}>
    <label className={cn(LABEL.base, LABEL.required)}>PIN</label>
    <input type="password" className={cn(INPUT.base, INPUT.size.lg)} placeholder="••••" />
    <p className={HELPER.base}>4-6 digit angka</p>
  </div>

  <button type="submit" className={cn(btn("primary", "lg"), "w-full")}>
    Masuk
  </button>
</form>
```

### 6.2 Product Form (multi-field)
```tsx
<form className="space-y-5">
  <div className="grid grid-cols-2 gap-4">
    <div className={FIELD.wrapper}>
      <label className={cn(LABEL.base, LABEL.required)}>SKU</label>
      <input type="text" className={cn(INPUT.base, INPUT.size.md)} />
    </div>
    <div className={FIELD.wrapper}>
      <label className={cn(LABEL.base, LABEL.required)}>Nama</label>
      <input type="text" className={cn(INPUT.base, INPUT.size.md)} />
    </div>
  </div>

  <div className={FIELD.wrapper}>
    <label className={LABEL.base}>Kategori</label>
    <select className={cn(SELECT.base, SELECT.size.md, "appearance-none")}>...</select>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div className={FIELD.wrapper}>
      <label className={cn(LABEL.base, LABEL.required)}>Harga</label>
      <input type="number" className={cn(INPUT.base, INPUT.size.md)} />
    </div>
    <div className={FIELD.wrapper}>
      <label className={LABEL.base}>Stok Awal</label>
      <input type="number" className={cn(INPUT.base, INPUT.size.md)} />
    </div>
  </div>

  <div className={FIELD.wrapper}>
    <label className={LABEL.base}>Deskripsi</label>
    <textarea className={cn(TEXTAREA.base, TEXTAREA.size.md, TEXTAREA.resize)} rows={3} />
    <p className={HELPER.base}>Opsional. Max 200 karakter.</p>
  </div>
</form>
```

### 6.3 Filter Bar (inline form)
```tsx
<div className="flex items-center gap-2">
  <input
    type="search"
    placeholder="Cari..."
    className={cn(INPUT.base, INPUT.size.sm, "flex-1")}
  />
  <select className={cn(SELECT.base, SELECT.size.sm, "appearance-none w-40")}>
    <option>Semua kategori</option>
  </select>
  <button className={btn("outline", "sm")}>Filter</button>
</div>
```

---

## 7. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `focus:ring-4` atau `focus:ring-1` | Divergent focus intensity | `focus-visible:ring-2` |
| `focus:ring-*` (bukan `focus-visible:ring-*`) | A11y: shows on mouse click too | `focus-visible:ring-*` |
| Missing `focus:outline-none` | Browser default outline | Always include |
| `rounded-lg` atau `rounded-md` untuk input | Legacy | `rounded-xl` |
| Missing `dark:border-slate-700` | Dark mode gap | Full pairing |
| `placeholder:text-slate-300` | Too light | `placeholder:text-slate-400` |
| `placeholder:text-slate-600` | Too dark | `placeholder:text-slate-400` |
| `disabled:opacity-50` tanpa `disabled:cursor-not-allowed` | Incomplete disabled UX | Pair both |
| Label di bawah input | Non-standard | Label above (stacked) or inline (checkbox/radio/switch) |
| Error text tanpa `aria-describedby` | A11y gap | Link `aria-describedby="field-error"` |
| Error color `text-red-*` | Wrong palette | `text-rose-*` |
| Placeholder sebagai label | A11y fail | Explicit `<label>` |
| Input tanpa `<label>` element | A11y fail | Use label or `aria-label` |
| Height < 36px untuk touch | Mobile a11y fail | Minimum `h-9` |
| `height` fixed + `<textarea>` | Bad UX | `min-h-*` + `resize-y` |
| Form dengan `onSubmit` tanpa `<form>` | Semantic fail | Wrap in `<form>` |

---

## 8. Migration Guide

### 8.1 Focus Ring Standardization (highest priority)
Scan untuk:
```diff
- focus:ring-4 focus:ring-indigo-100
- focus:ring-1 focus:ring-slate-300
- focus:ring-0
+ focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20
```

### 8.2 Dark Mode Fill (11 inputs)
Scan `border-slate-200 rounded-xl` tanpa `dark:border-slate-700` → tambah `dark:border-slate-700`.

### 8.3 Radius Harmonization (12 inputs)
- `rounded-lg` → `rounded-xl`
- `rounded-md` → `rounded-xl`

### 8.4 Placeholder Color (19 inputs)
```diff
- placeholder:text-slate-300
- placeholder:text-slate-600
+ placeholder:text-slate-400 dark:placeholder:text-slate-500
```

### 8.5 Disabled State Pairing
Scan `disabled:opacity-*` tanpa `disabled:cursor-not-allowed` → tambah cursor.

### 8.6 Field Wrapper Adoption
Refactor form field ad-hoc:
```diff
- <div>
-   <label className="text-xs font-bold mb-1 block">Email</label>
-   <input className="..." />
- </div>
+ <div className={FIELD.wrapper}>
+   <label className={LABEL.base}>Email</label>
+   <input className={cn(INPUT.base, INPUT.size.md)} />
+ </div>
```

### Per-page priority
1. **PengaturanPage** — highest form density
2. **ProductForm** (InventarisPage modal)
3. **LoginPage / AuthPages**
4. **StockOpnameModal / StockUpdateModal / StockTransferModal**
5. **CashManagementPage modals**
6. **UserManagementPage forms**

### Code Review Rubric
1. Focus pattern bukan `focus-visible:ring-2 focus-visible:ring-indigo-500/20`? → **request change**
2. `rounded-lg`/`rounded-md` untuk input? → **request change**
3. Missing dark mode counterpart? → **reject**
4. `placeholder:text-slate-{300|600}`? → **request change**
5. Disabled tanpa cursor pair? → **request change**
6. Error pakai `red-*`? → **request change** (`rose-*`)
7. Input tanpa `<label>` atau `aria-label`? → **reject** (a11y)
8. Form field tanpa Field wrapper atau `space-y-1.5` equivalent? → **request change**
9. Height < 36px (h-9)? → **request change**
10. Error text tanpa `aria-describedby` link? → **request change**

---

## 9. Future Enhancements

- [ ] Combobox / autocomplete component (tidak ada di codebase saat ini)
- [ ] Date picker spec (currently inconsistent across pages)
- [ ] File upload dropzone pattern
- [ ] Multi-select chip pattern
- [ ] OTP input (4-6 digit) untuk PIN entry
- [ ] Password strength indicator
- [ ] Async validation pattern (debounced check SKU/email)
- [ ] React Hook Form integration snippets
- [ ] Form persistence pattern (auto-save draft)
- [ ] Storybook page dengan semua field states

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
