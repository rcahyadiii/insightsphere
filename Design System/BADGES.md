# 🏷️ InsightSphere Badge & Avatar System

> **Single source of truth untuk badges, chips, status indicators, dan avatar.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/data.ts`
> Companion specs: `COLORS.md`, `TABLES.md`, `TYPOGRAPHY.md`

---

## 1. Overview

InsightSphere pakai hand-rolled badge pattern (0 shadcn `<Badge>` usage). Audit menemukan 14+ chip instances dengan 3 size varian yang tidak formal: `px-2 py-0.5` (9×), `px-3 py-1` (2×), `px-3 py-1.5` (2×).

Avatar minimal: 3 shadcn + 4 initials-based.

**Policy ini memformalkan 3 size tier + 7 semantic variant + role badges + initials avatar.**

---

## 2. Design Principles

### 2.1 Badge Anatomy (Pill)
```
┌────────────────────────┐
│ [icon]  TEXT   [count] │  ← inline-flex, rounded-full, gap-1
└────────────────────────┘
```
- **Wajib** `rounded-full` (pill shape)
- `font-bold` untuk readability di small size
- Border subtle (50-level) untuk definition
- `inline-flex items-center gap-1` untuk icon alignment

### 2.2 Size Hierarchy (3 Tiers)
| Tier | Padding | Text | Use case |
|:---:|:---:|:---:|---|
| `xs` | `px-2 py-0.5` | `text-[10px]` | Micro badge, table cell, sidebar count |
| **`sm`** | **`px-2.5 py-0.5`** | **`text-xs`** | **Default** |
| `md` | `px-3 py-1` | `text-xs` | Standalone badge, header chip |
| `lg` | `px-3 py-1.5` | `text-xs` | Hero badge, status banner |

### 2.3 Semantic Variants (7)
Setiap variant punya bg + text + border dengan dark mode pair:
| Variant | Use | Color family |
|---|---|---|
| `success` | Aktif, lunas, approved | `emerald` |
| `warning` | Waiting, transit, pending | `amber` |
| `destructive` | Error, expired, rejected | `rose` |
| `info` | Note, transit, neutral info | `blue` |
| `primary` | Feature, highlight, promoted | `indigo` |
| `neutral` | Default, draft, undefined | `slate` |
| `inventory` | Role accent untuk inventory_manager | `teal` |

### 2.4 Dark Mode Parity (Wajib)
```
bg-emerald-50 → dark:bg-emerald-900/30
text-emerald-700 → dark:text-emerald-400
border-emerald-100 → dark:border-emerald-800/50
```
Dari `COLORS.md` DARK_MODE_PAIRING.

### 2.5 Typography (Minimal Uppercase)
Dari `TYPOGRAPHY.md v1.1`: Badge = **Title Case** atau **Sentence case**, **bukan** uppercase.

Exception: `T.micro` badge dengan `text-[10px] font-black uppercase tracking-widest` masih allowed untuk status chip mikro (mis. "BARU", "PROMO", "HOT").

---

## 3. Badge Usage

### 3.1 Basic Semantic Badge
```tsx
import { BADGE } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

<span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>
  <Check className="size-3" /> Aktif
</span>
```

### 3.2 Count Badge (Notification, Sidebar)
```tsx
<span className={cn(BADGE.base, BADGE.size.xs, BADGE.variant.destructive)}>
  {unreadCount}
</span>
```

### 3.3 Status Chip in Table
```tsx
<td className={TABLE.cell}>
  {order.status === "paid" ? (
    <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>Lunas</span>
  ) : order.status === "transit" ? (
    <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.warning)}>Transit</span>
  ) : (
    <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.neutral)}>Draft</span>
  )}
</td>
```

### 3.4 Icon-First Badge
```tsx
<span className={cn(BADGE.base, BADGE.size.md, BADGE.variant.warning)}>
  <AlertTriangle className="size-3.5" />
  Stok menipis
</span>
```

### 3.5 Role Badge (User Card)
```tsx
<span className={cn(BADGE.base, BADGE.size.sm, BADGE.role.admin)}>
  <Shield className="size-3" /> Admin
</span>
```

### 3.6 Standalone Hero Badge (Promo, Feature)
```tsx
<span className={cn(BADGE.base, BADGE.size.lg, BADGE.variant.primary)}>
  <Sparkles className="size-3.5" /> Fitur Baru
</span>
```

### 3.7 Micro Uppercase Chip (`T.micro`)
Legitimate uppercase use case (dari `TYPOGRAPHY.md v1.1`):
```tsx
<span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
  Promo
</span>
```

---

## 4. Role Badges

Mirror pattern dari `PortalTemplate.tsx` role colors (sudah diharmonisasi di Color Palette Cleanup):

| Role | Color | Tailwind |
|---|---|---|
| `owner` | Indigo | `BADGE.role.owner` |
| `admin` | Rose | `BADGE.role.admin` |
| `inventory_manager` | Teal | `BADGE.role.inventory` |
| `cashier` | Slate | `BADGE.role.cashier` |

```tsx
function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn(BADGE.base, BADGE.size.sm, BADGE.role[role])}>
      <Shield className="size-3" />
      {roleLabel[role]}
    </span>
  );
}
```

---

## 5. Avatar System

### 5.1 Avatar Anatomy
```
┌────────┐
│        │
│   FA   │  ← initials (2 chars max), font-bold
│        │
└────────┘
```
Atau untuk image-based: `<img>` dalam wrapper `rounded-full overflow-hidden`.

### 5.2 Size Tiers (5)
| Tier | Size | Text | Use case |
|:---:|:---:|:---:|---|
| `xs` | `size-6` (24px) | `text-[10px]` | Inline list, table cell |
| `sm` | `size-8` (32px) | `text-xs` | Menu item, comment author |
| **`md`** | **`size-10` (40px)** | **`text-sm`** | **Default** — header, card |
| `lg` | `size-12` (48px) | `text-base` | Profile card, user info |
| `xl` | `size-16` (64px) | `text-xl` | Profile page hero |

### 5.3 Role Color (Initials Avatar)
Pair dengan role color:
```tsx
<div className={cn(AVATAR.base, AVATAR.size.md, AVATAR.role.admin)}>
  {initials}
</div>
```

| Role | Color |
|---|---|
| `owner` | Indigo bg + text-indigo-700 |
| `admin` | Rose bg + text-rose-700 |
| `inventory_manager` | Teal bg + text-teal-700 |
| `cashier` | Slate bg + text-slate-700 |

### 5.4 Image Avatar
```tsx
<div className={cn(AVATAR.base, AVATAR.size.md, "overflow-hidden")}>
  <img
    src={user.avatar_url}
    alt={user.name}
    className="w-full h-full object-cover"
    onError={(e) => { e.currentTarget.style.display = "none"; }}
  />
</div>
```

### 5.5 Status Dot (Online/Offline)
```tsx
<div className="relative">
  <div className={cn(AVATAR.base, AVATAR.size.md, AVATAR.role.admin)}>FA</div>
  <span className={cn(
    "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white dark:border-slate-900",
    isOnline ? "bg-emerald-500" : "bg-slate-400"
  )} />
</div>
```

### 5.6 Avatar Stack (Multiple Users)
```tsx
<div className="flex -space-x-2">
  {users.slice(0, 3).map(u => (
    <div
      key={u.id}
      className={cn(AVATAR.base, AVATAR.size.sm, AVATAR.role[u.role], "ring-2 ring-white dark:ring-slate-900")}
    >
      {initials(u.name)}
    </div>
  ))}
  {users.length > 3 && (
    <div className={cn(AVATAR.base, AVATAR.size.sm, AVATAR.role.cashier, "ring-2 ring-white dark:ring-slate-900")}>
      +{users.length - 3}
    </div>
  )}
</div>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Ad-hoc `px-*` + `py-*` chip | Size variance | `BADGE.size.{xs/sm/md/lg}` |
| Badge tanpa `rounded-full` | Not pill-shape, looks like button | Always `rounded-full` |
| Badge tanpa border | Low definition on light bg | Include `border border-*-100` |
| Badge dengan `font-normal` | Weak readability at small size | `font-bold` minimum |
| `bg-red-*` untuk destructive | Wrong palette | `rose-*` |
| Uppercase untuk label normal | Violates Typography v1.1 | Title Case |
| Exception: `T.micro` uppercase for hero chips | OK for 10px+ tracking-widest | Kept allowed |
| Avatar image tanpa fallback initials | Broken UX saat image 404 | Always provide initials fallback |
| Avatar tanpa `rounded-full` | Not an avatar | `rounded-full` |
| Status dot tanpa `border-2 border-white` | Blends into avatar | Always ring |
| Role color arbitrary (bukan dari palette) | Inconsistent | Use `BADGE.role.*` / `AVATAR.role.*` |
| Avatar size non-standard (`size-7`, `size-9`) | Scale violation | Stick to xs/sm/md/lg/xl |

---

## 7. Migration Guide

### 7.1 Badge Token Adoption
Scan hand-rolled chips:
```diff
- <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
-   Aktif
- </span>
+ <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>Aktif</span>
```

### 7.2 Badge Size Unification
- `px-2 py-0.5` → `BADGE.size.xs` or `sm`
- `px-3 py-1` → `BADGE.size.md`
- `px-3 py-1.5` → `BADGE.size.lg`

### 7.3 Dark Mode Fill
Ensure all badge variants include `dark:` pairings per `BADGE.variant.*`.

### 7.4 Role Badge Consolidation
Ada beberapa file yang define role color secara lokal (PortalTemplate, Sidebar, UserManagementPage). Refactor semua ke `BADGE.role.*`.

### 7.5 Avatar Consolidation
3 shadcn `<Avatar>` + 4 hand-rolled initials → unified via `AVATAR.*` tokens.

### Per-page priority
1. **TransactionHistoryPage** — status badges di setiap row
2. **InventarisPage** — stock status chips
3. **StockMovementPage** — movement type badges
4. **LaporanPage** — status chips (already fixed blue→amber)
5. **UserManagementPage** — role badges + avatar
6. **Sidebar** — role indicator + user avatar

### Code Review Rubric
1. Badge tanpa `rounded-full`? → **reject**
2. Padding bukan `BADGE.size.*`? → **request change**
3. Warna bukan dari `BADGE.variant.*`? → **request change**
4. Missing dark mode pair? → **reject**
5. Avatar tanpa fallback initials? → **request change**
6. Avatar size non-standard? → **request change**
7. Role color hardcoded (bukan `BADGE.role.*`)? → **request change**

---

## 8. Future Enhancements

- [ ] Custom badge component `<Badge variant="success" size="sm">` wrapper
- [ ] Dismissable badge (with X close button)
- [ ] Badge with click action (tag filter)
- [ ] Progress badge (0-100% indicator)
- [ ] Avatar with image + lazy load + blur placeholder
- [ ] Avatar group collapse logic (AvatarStack component)
- [ ] Animated status dot (pulse for online)
- [ ] Storybook page dengan semua variants + size matrix

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
