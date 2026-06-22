# 🍞 InsightSphere Breadcrumbs & PageHeader System

> **Single source of truth untuk breadcrumb trail dan page header (location context).**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/nav.ts` + `frontend/src/app/components/Breadcrumbs.tsx`
> Companion specs: `NAVIGATION.md`, `TABS.md`, `CARDS.md`

---

## 1. Overview

Dua komponen untuk "orient user where they are":

| Komponen | Status |
|---|---|
| `Breadcrumbs.tsx` | ✅ Exists (75 LOC) tapi underused — hanya 1 `<Breadcrumb>` usage |
| `PageHeader` | ❌ **Tidak ada komponen** — setiap page reinvent pattern |

Policy ini:
1. Formalkan breadcrumb pattern + truncation rules
2. **Create `PageHeader` component** (title + subtitle + actions)
3. Unify location context across all pages

---

## 2. Design Principles

### 2.1 Breadcrumb = Trail, PageHeader = Current Page
| Aspect | Breadcrumb | PageHeader |
|---|---|---|
| **Scope** | Full path (Home > Section > Subsection) | Current page only |
| **Location** | Top of page (above header atau di header) | Top of page content (below header) |
| **Info** | Parent hierarchy | Title + subtitle + quick actions |
| **Style** | Muted small text, inline | Hero section — bold large title + CTA |

Keduanya **complementary**, bukan either/or.

### 2.2 Breadcrumb Typography (Minimal Uppercase)
Per `TYPOGRAPHY.md v1.1`:
- Label: `text-sm font-medium`
- Current (last segment): `text-sm font-bold`
- **No** `uppercase tracking-widest`

### 2.3 Breadcrumb Truncation
Segment panjang di-truncate dengan `max-w-[150px]` + `truncate`:
```
SmartStock > Inventaris > Kertas HVS A4 80gr... > Edit
```

### 2.4 Breadcrumb on Mobile
Di mobile (<768px):
- Show only **last 2 segments** + back arrow
- Atau: Show only current + back arrow
```
← Back  |  Kertas HVS A4 80gr
```

### 2.5 PageHeader Has Standard Anatomy
Hero section di top setiap page wajib pakai pattern:
```
[Icon Box]  Title                 [Action 1] [Action 2]
            Subtitle
─────────────────────────────────────────────────────
```

### 2.6 PageHeader Actions Placement
Actions di **kanan atas**, max 2-3 buttons:
- Primary action (e.g. `+ Tambah`)
- Secondary (e.g. `Export`)
- Overflow menu (more actions)

---

## 3. Breadcrumb Anatomy

```
🏠 SmartStock  ›  Inventaris  ›  Edit Produk
     ↑            ↑               ↑
    home         link segment    current (bold)
```

### 3.1 Structure Tokens
```
BREADCRUMB.nav             // flex + items-center + gap-2 + aria-label="Breadcrumb"
BREADCRUMB.home            // text-sm font-bold text-slate-900 dark:text-slate-100
BREADCRUMB.link            // text-sm text-slate-500 dark:text-slate-400 + hover:text-slate-900
BREADCRUMB.current         // text-sm font-bold text-slate-700 dark:text-slate-200 + truncate + max-w-[150px]
BREADCRUMB.separator       // size-4 text-slate-300 dark:text-slate-600
BREADCRUMB.segment         // flex items-center gap-2
```

### 3.2 Default Separator
Pakai `ChevronRight` dari lucide:
```tsx
<ChevronRight className={BREADCRUMB.separator} />
```

Alternatif: `/` atau `›` string tapi lucide icon lebih konsisten.

---

## 4. Breadcrumb Usage Examples

### 4.1 Existing Component (Already in Codebase)
```tsx
import { Breadcrumbs } from "@/app/components/Breadcrumbs";

// Otomatis pakai usePathname() + routes mapping
<Breadcrumbs />
```

### 4.2 Manual Breadcrumb (Custom Path)
```tsx
<nav className={BREADCRUMB.nav} aria-label="Breadcrumb">
  <Link href="/" className={BREADCRUMB.home}>
    SmartStock
  </Link>
  <ChevronRight className={BREADCRUMB.separator} />
  <Link href="/inventaris" className={BREADCRUMB.link}>
    Inventaris
  </Link>
  <ChevronRight className={BREADCRUMB.separator} />
  <span className={BREADCRUMB.current}>
    {product.name}
  </span>
</nav>
```

### 4.3 Mobile Breadcrumb (Back + Current)
```tsx
<nav className="flex items-center gap-2 lg:hidden" aria-label="Breadcrumb">
  <button
    onClick={() => router.back()}
    className={cn(HEADER.iconButton, "p-1.5")}
  >
    <ArrowLeft className="size-4" />
  </button>
  <span className={BREADCRUMB.current}>
    {currentPageTitle}
  </span>
</nav>
```

### 4.4 Breadcrumb dengan Icon (Contextual)
```tsx
<nav className={BREADCRUMB.nav} aria-label="Breadcrumb">
  <Link href="/" className={cn(BREADCRUMB.home, "flex items-center gap-1.5")}>
    <Home className="size-3.5" />
    SmartStock
  </Link>
  <ChevronRight className={BREADCRUMB.separator} />
  <Link href="/inventaris" className={cn(BREADCRUMB.link, "flex items-center gap-1.5")}>
    <Package className="size-3.5" />
    Inventaris
  </Link>
</nav>
```

---

## 5. PageHeader Design Principles

### 5.1 Anatomy (4 Parts)
```
┌─────────────────────────────────────────────────────────┐
│ [Icon Box]  Title (text-2xl font-black)    [Actions]    │
│             Subtitle (text-sm slate-500)                 │
└─────────────────────────────────────────────────────────┘
```

| Part | Purpose | Required? |
|---|---|:---:|
| Icon box | Visual anchor (semantic-colored) | Optional (recommended) |
| Title | Current page name | ✅ |
| Subtitle | Context, count, date range | Optional |
| Actions | Primary/secondary CTAs | Optional |

### 5.2 Title Typography
- `text-2xl font-black` desktop
- `text-xl font-black` mobile
- Color: `text-slate-900 dark:text-slate-100`
- **No uppercase** (per Typography v1.1)

### 5.3 Subtitle Typography
- `text-sm text-slate-500 dark:text-slate-400`
- `font-medium`
- Max 1-2 sentences

### 5.4 Icon Box (Optional)
Mirror pattern dari `CARDS.md §3.3`:
```
p-2.5 rounded-xl bg-{semantic}-50 dark:bg-{semantic}-900/30
+ icon size-5 text-{semantic}-600 dark:text-{semantic}-400
```

Contextual per page:
| Page | Semantic | Icon |
|---|---|---|
| Dashboard | primary (indigo) | `LayoutDashboard` |
| Inventaris | success (emerald) | `Package` |
| Kasir | warning (amber) | `ShoppingCart` |
| Laporan | info (blue) | `FileBarChart` |
| MLOps | ai (violet) | `BrainCircuit` |
| Pengaturan | neutral (slate) | `Settings` |

### 5.5 Actions Area
- Max 2-3 buttons di kanan
- Primary action paling kanan
- Overflow (`MoreHorizontal`) jika > 3 actions

### 5.6 Separator
Di bawah PageHeader biasanya ada:
- `pb-6 mb-6 border-b border-slate-100 dark:border-slate-800` (ringan)
- Atau tidak ada separator (clean spacing)

---

## 6. PageHeader Anatomy

### 6.1 Structure Tokens
```
PAGE_HEADER.wrapper          // flex items-start justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800
PAGE_HEADER.left             // flex items-start gap-4
PAGE_HEADER.iconBox          // p-2.5 rounded-xl (apply semantic tone after)
PAGE_HEADER.iconBoxSemantic  // {success/primary/warning/destructive/info/neutral/ai}
PAGE_HEADER.titleBlock       // space-y-1
PAGE_HEADER.title            // text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100
PAGE_HEADER.subtitle         // text-sm text-slate-500 dark:text-slate-400
PAGE_HEADER.actions          // flex items-center gap-2 shrink-0
```

### 6.2 Semantic Icon Box Variants
Re-use dari `KPI.iconBox` (sama semantic):
```
PAGE_HEADER.iconBoxSemantic.primary     // indigo
PAGE_HEADER.iconBoxSemantic.success     // emerald
PAGE_HEADER.iconBoxSemantic.warning     // amber
PAGE_HEADER.iconBoxSemantic.destructive // rose
PAGE_HEADER.iconBoxSemantic.info        // blue
PAGE_HEADER.iconBoxSemantic.ai          // violet
PAGE_HEADER.iconBoxSemantic.neutral     // slate
```

---

## 7. PageHeader Usage Examples

### 7.1 Basic PageHeader
```tsx
<header className={PAGE_HEADER.wrapper}>
  <div className={PAGE_HEADER.left}>
    <div className={cn(PAGE_HEADER.iconBox, PAGE_HEADER.iconBoxSemantic.success)}>
      <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className={PAGE_HEADER.titleBlock}>
      <h1 className={PAGE_HEADER.title}>Inventaris</h1>
      <p className={PAGE_HEADER.subtitle}>142 produk aktif · Diperbarui 2 menit lalu</p>
    </div>
  </div>
  <div className={PAGE_HEADER.actions}>
    <button className={btn("outline", "md")}>
      <Download className="size-4" /> Export
    </button>
    <button className={btn("primary", "md")}>
      <Plus className="size-4" /> Tambah Produk
    </button>
  </div>
</header>
```

### 7.2 PageHeader tanpa Icon Box (Minimalist)
```tsx
<header className={PAGE_HEADER.wrapper}>
  <div className={PAGE_HEADER.titleBlock}>
    <h1 className={PAGE_HEADER.title}>Pengaturan</h1>
    <p className={PAGE_HEADER.subtitle}>Kelola preferensi akun dan bisnis Anda</p>
  </div>
  <button className={btn("outline", "md")}>
    <Save className="size-4" /> Simpan Perubahan
  </button>
</header>
```

### 7.3 PageHeader dengan Badge (Status)
```tsx
<header className={PAGE_HEADER.wrapper}>
  <div className={PAGE_HEADER.left}>
    <div className={cn(PAGE_HEADER.iconBox, PAGE_HEADER.iconBoxSemantic.warning)}>
      <ShoppingCart className="size-5 text-amber-600 dark:text-amber-400" />
    </div>
    <div className={PAGE_HEADER.titleBlock}>
      <div className="flex items-center gap-2">
        <h1 className={PAGE_HEADER.title}>Kasir</h1>
        <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>
          Shift Aktif
        </span>
      </div>
      <p className={PAGE_HEADER.subtitle}>Kasir: Sarah · Mulai 08:00</p>
    </div>
  </div>
  <button className={btn("destructive", "md")}>
    <Lock className="size-4" /> Tutup Shift
  </button>
</header>
```

### 7.4 PageHeader + Breadcrumb Combined (Full Location Context)
```tsx
<div className="space-y-3">
  <Breadcrumbs />
  <header className={PAGE_HEADER.wrapper}>
    <div className={PAGE_HEADER.left}>
      <div className={cn(PAGE_HEADER.iconBox, PAGE_HEADER.iconBoxSemantic.primary)}>
        <LayoutDashboard className="size-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className={PAGE_HEADER.titleBlock}>
        <h1 className={PAGE_HEADER.title}>Dashboard</h1>
        <p className={PAGE_HEADER.subtitle}>Selamat datang kembali, Faiz</p>
      </div>
    </div>
  </header>
</div>
```

### 7.5 PageHeader Mobile-Aware
```tsx
<header className={cn(PAGE_HEADER.wrapper, "flex-col sm:flex-row")}>
  <div className={PAGE_HEADER.left}>
    {/* icon + title block */}
  </div>
  <div className={cn(PAGE_HEADER.actions, "w-full sm:w-auto justify-stretch")}>
    <button className={cn(btn("primary", "md"), "flex-1 sm:flex-initial")}>
      <Plus className="size-4" /> Tambah
    </button>
  </div>
</header>
```

---

## 8. 🚫 Prohibited Patterns

### Breadcrumb
| Pattern | Why | Replacement |
|---|---|---|
| Breadcrumb dengan `uppercase tracking-widest` | Violates Typography v1.1 | `text-sm font-medium` |
| Segment tanpa truncation (>30 chars) | Overflow | `truncate max-w-[150px]` |
| Breadcrumb full-length di mobile | Overflow, unreadable | Back + current pattern |
| Separator custom char tanpa fallback | Font availability issue | Use `ChevronRight` icon |
| Current segment sebagai `<a>` (clickable) | Redundant (current page) | `<span>` non-clickable |
| Breadcrumb tanpa `aria-label="Breadcrumb"` | A11y miss | Always include |
| Home link label "Home" | Generic | Use app name ("SmartStock") |

### PageHeader
| Pattern | Why | Replacement |
|---|---|---|
| Title `text-4xl` | Too large, hurt visual hierarchy | `text-2xl` max |
| Title `uppercase tracking-widest` | Violates Typography v1.1 | Normal case + `font-black` |
| 4+ actions di header | Decision fatigue | Max 2-3 + overflow menu |
| Subtitle > 2 sentences | Too much context | 1-2 sentences max |
| Icon box tanpa semantic color match | Inconsistent | Use semantic palette |
| PageHeader duplikasi judul dengan Sidebar | Redundant | Sidebar = nav, PageHeader = current |
| PageHeader tanpa padding-bottom | Cramped | `pb-6 mb-6 border-b` |
| Actions di kiri | Non-standard | Always right |
| Multiple primary buttons | Hierarchy violation | 1 primary + 1-2 secondary |

---

## 9. Migration Guide

### 9.1 Breadcrumb Adoption (1 → all pages)
Saat ini hanya 1 page yang pakai `<Breadcrumbs>`. Target: setiap page non-root:

```diff
// pages/InventarisPage.tsx
+ import { Breadcrumbs } from "@/app/components/Breadcrumbs";

  export default function InventarisPage() {
    return (
      <div className="space-y-6">
+       <Breadcrumbs />
        <PageHeader ... />
        ...
      </div>
    );
  }
```

### 9.2 Typography Cleanup di Breadcrumbs.tsx
Breadcrumbs existing pakai:
```
text-slate-600 text-sm font-bold uppercase tracking-widest text-[11px]
```
di fallback dashboard. Migrate ke:
```
text-slate-700 dark:text-slate-200 text-sm font-bold
```

### 9.3 Create PageHeader Component (NEW)
Buat `frontend/src/app/components/PageHeader.tsx` sebagai komponen reusable:
```tsx
interface PageHeaderProps {
  icon?: LucideIcon;
  iconTone?: "primary" | "success" | "warning" | ...;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: boolean; // include Breadcrumbs above
  className?: string;
}
```

Adopsi di setiap page untuk consistency.

### Per-page priority
1. **DashboardPage** — first impression
2. **InventarisPage** — heavy CRUD
3. **KasirPage (POS)** — kashier-facing
4. **LaporanPage** — data-heavy
5. **PengaturanPage** — settings (multi-tab)
6. **UserProfilePage** — profile hero
7. **Semua page** lainnya

### Code Review Rubric
1. Breadcrumb uppercase? → **request change**
2. PageHeader title > `text-2xl`? → **request change**
3. Icon box color ≠ semantic match? → **request change**
4. Actions > 3 buttons? → **request change**
5. PageHeader duplikasi dengan Sidebar item? → **request change**
6. Missing `aria-label="Breadcrumb"`? → **reject**
7. Current segment sebagai `<a>`? → **request change**

---

## 10. Future Enhancements

- [ ] Create `<PageHeader>` component (pending — this spec)
- [ ] Animated breadcrumb transitions saat navigate
- [ ] Contextual "back" smart detection (browser history + app history)
- [ ] Breadcrumb with dropdown (for deeply-nested paths)
- [ ] PageHeader with tabs built-in (combine TABS.md + PageHeader)
- [ ] PageHeader with stats preview (inline metrics)
- [ ] Breadcrumb with editable current title (in-line rename)
- [ ] Schema.org BreadcrumbList structured data (SEO)
- [ ] Storybook dengan all variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
