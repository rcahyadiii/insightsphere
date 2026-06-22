# 🧭 InsightSphere Navigation System

> **Single source of truth untuk Sidebar, Header, dan Command Palette (app chrome).**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/nav.ts`
> Companion specs: `TABS.md`, `BREADCRUMBS.md`, `COLORS.md`, `TYPOGRAPHY.md`

---

## 1. Overview

InsightSphere app chrome terdiri dari 3 komponen selalu-visible:

| Komponen | File | Status |
|---|---|---|
| Sidebar | `components/Sidebar.tsx` | ✅ Widespread, role-aware, collapsible |
| Header | `components/Header.tsx` | ✅ TopBar dengan breadcrumb + store selector + theme/lang toggle |
| Command Palette | `components/CommandPalette.tsx` | ✅ Ctrl+K launcher (10 `<Command>` + 2 `CommandDialog`) |

Policy ini memformalkan anatomy, active link pattern, dark chrome, dan mobile adaptation.

---

## 2. Design Principles

### 2.1 App Chrome = Dark Slate (Sidebar)
Sidebar InsightSphere pakai **dark slate chrome** (`bg-slate-900`) walaupun light mode aktif. Alasannya:
- Persistent visual anchor (selalu sama apapun mode)
- Contrast tinggi dengan content area (slate-50/white)
- Branding consistency dengan logo + tagline

**NOT:** light sidebar dengan dark mode toggle only.

### 2.2 Sidebar Active State: Elevated Surface
Active link pakai **elevated slate surface**, bukan bright indigo solid:
```
bg-slate-700/60 text-white shadow-sm ring-1 ring-white/5
```
- Lebih subtle dari `bg-indigo-600` (avoid color competition)
- Ring + shadow memberikan "lifted" effect
- `text-white` full, bukan `text-indigo-400`

### 2.3 Header Sticky + Translucent
Header selalu `sticky top-0 z-40` dengan bg `bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm` untuk efek overlay pada content yang scroll.

### 2.4 Command Palette Ubiquitous
`Ctrl+K` (Windows/Linux) / `⌘K` (Mac) = universal shortcut. Accessible dari mana saja.

### 2.5 Mobile: Sidebar Drawer
Di viewport < 1024px (lg), sidebar **harus** collapsible ke drawer:
- Trigger: hamburger icon di Header
- Pattern: right/left drawer dari `DRAWERS.md` + backdrop overlay
- Close on navigation

### 2.6 Role-Aware Filtering
Sidebar items difilter berdasarkan `role` user dari `AuthContext`. Unauthorized routes tidak muncul (bukan disabled dengan lock icon).

---

## 3. Sidebar Anatomy

```
┌────────────────┐
│  [Logo] App    │  ← Logo section (h-14, border-b)
├────────────────┤
│                │
│ [icon] Label   │  ← Nav item (inactive)
│ [icon] Label   │
│ ■ Label ■      │  ← Nav item (active: slate-700/60 + ring)
│ [icon] Label   │
│                │
│                │
├────────────────┤
│  [Avatar] User │  ← Footer (user info + logout)
│  Mode: Owner   │
│  [◀ Collapse]  │  ← Collapse toggle
└────────────────┘
```

### 3.1 Dimensions
| Mode | Width |
|---|---|
| Expanded | `w-[240px]` |
| Collapsed | `w-[68px]` |
| Transition | `duration-300 ease-in-out` |

### 3.2 Structure Tokens (`nav.ts`)
```
SIDEBAR.aside         // bg-slate-900 + border-r + flex col
SIDEBAR.logo          // h-14 + flex items-center + border-b
SIDEBAR.nav           // flex-1 + py-3 + px-3 + space-y-1 + overflow-y-auto
SIDEBAR.link          // flex items-center + gap-3 + px-3 + py-2 + rounded-lg
SIDEBAR.linkActive    // bg-slate-700/60 + text-white + shadow-sm + ring-1 ring-white/5
SIDEBAR.linkInactive  // text-slate-400 + hover:text-slate-200 + hover:bg-slate-800
SIDEBAR.icon          // w-5 + h-5 + transition-transform
SIDEBAR.iconActive    // text-white + scale-110
SIDEBAR.footer        // border-t + p-3
SIDEBAR.collapse      // toggle button
```

### 3.3 Icon Policy
- **Size:** `size-5` (20px) — aligned dengan `SPACING.md` icon sizing
- **Active icon:** scale-110 + text-white
- **Inactive icon:** group-hover:scale-110
- **Alignment:** `shrink-0 w-6 flex justify-center` (consistent spacing even when collapsed)

---

## 4. Header Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ [☰] SmartStock > Dashboard   [Cmd+K search]   [🏪] [🌐] [🌙] [🔔]│
│  ↑     ↑                          ↑              ↑   ↑   ↑   ↑  │
│  mobile breadcrumbs            command          store lang theme notif│
│  trigger                       palette trigger                       │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Dimensions
| Property | Value |
|---|---|
| Height | `h-14` (56px) |
| Padding | `px-6` (24px) |
| Gap between groups | `gap-3` |
| Position | `sticky top-0 z-40` |

### 4.2 Structure Tokens
```
HEADER.base           // sticky top-0 z-40 + bg-white/80 dark:bg-slate-900/80 + backdrop-blur-sm + border-b + h-14
HEADER.container      // flex items-center + px-6 + h-full
HEADER.leftCluster    // flex items-center + gap-3 (mobile trigger + breadcrumb)
HEADER.centerCluster  // flex-1 + max-w-md (command palette trigger)
HEADER.rightCluster   // flex items-center + gap-2 (store + lang + theme + notif + avatar)
HEADER.iconButton     // p-2 + rounded-xl + hover:bg-slate-100 + dark:hover:bg-slate-800
```

### 4.3 Right-Cluster Composition (priority right-to-left)
1. User avatar / menu
2. Notification bell (with badge count)
3. Theme toggle (sun/moon)
4. Language toggle
5. Store selector (if multi-store)

---

## 5. Command Palette

### 5.1 Shortcut
| Platform | Keys |
|---|---|
| Windows/Linux | `Ctrl+K` |
| Mac | `⌘K` |

### 5.2 Trigger (in Header)
```tsx
<button className={HEADER.iconButton}>
  <Search className="size-4" />
  <span className="text-xs text-slate-500">Cari...</span>
  <kbd className="ml-auto px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
    Ctrl K
  </kbd>
</button>
```

### 5.3 Command Dialog Anatomy
```
┌─────────────────────────────────┐
│ 🔍 [Search input]              │  ← Search
├─────────────────────────────────┤
│ Halaman                         │  ← Group label
│   ► Dashboard               ⌘D │  ← Command item
│   ► Inventaris              ⌘I │
│                                 │
│ Aksi Cepat                      │  ← Group label
│   ► Tambah Produk               │
│   ► Buka POS                    │
└─────────────────────────────────┘
```

### 5.4 Token Reference
Shadcn `<CommandDialog>` sudah pre-styled. Gunakan langsung. Override minimal:
```
CMD_PALETTE.trigger   // composable pill-style trigger
CMD_PALETTE.dialog    // default shadcn + dark mode fix jika perlu
CMD_PALETTE.itemRoute // command for route navigation
CMD_PALETTE.itemAction // command for action execution
```

---

## 6. Active Link Policy (3 Patterns)

InsightSphere pakai **3 pattern** untuk active state, sesuai konteks:

| Pattern | Context | Class |
|---|---|---|
| **Elevated Slate** | Sidebar (dark chrome) | `bg-slate-700/60 text-white ring-1 ring-white/5` |
| **Solid Indigo** | Primary CTA-like, mode toggles, tabs | `bg-indigo-600 text-white` |
| **Soft Indigo** | In-content nav (tab, chip, filter) | `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300` |

**Rule of thumb:**
- Dark chrome (sidebar) → Elevated Slate
- Primary action / hero active → Solid Indigo
- Secondary nav / content-level → Soft Indigo

---

## 7. Mobile Navigation

### 7.1 Breakpoint
| Breakpoint | Sidebar behavior |
|---|---|
| `lg` (≥1024px) | Persistent sidebar (expanded or collapsed) |
| `<lg` | Drawer (hidden by default, hamburger trigger) |

### 7.2 Drawer Pattern
Pakai `DRAWERS.md` left drawer pattern:
```tsx
<div className={cn(DRAWER.backdrop, M.backdropEnter)} onClick={closeDrawer}>
  <aside className={cn(DRAWER.left, DRAWER.size.left.sm, M.drawerEnterLeft)}>
    <Sidebar mobile={true} onNavigate={closeDrawer} />
  </aside>
</div>
```

### 7.3 Mobile Header Adjustments
- Hamburger icon kiri (trigger drawer)
- Breadcrumb truncate lebih agresif
- Command palette icon-only (hide "Cari..." text)
- Right cluster: consider overflow menu untuk theme+lang

---

## 8. Usage Examples

### 8.1 Basic Sidebar Link
```tsx
<Link
  href="/dashboard"
  className={cn(
    SIDEBAR.link,
    isActive ? SIDEBAR.linkActive : SIDEBAR.linkInactive
  )}
>
  <div className="shrink-0 w-6 flex justify-center">
    <LayoutDashboard className={cn(SIDEBAR.icon, isActive && SIDEBAR.iconActive)} />
  </div>
  {!collapsed && <span className="text-sm font-medium">Dashboard</span>}
</Link>
```

### 8.2 Header Basic
```tsx
<header className={HEADER.base}>
  <div className={HEADER.container}>
    <div className={HEADER.leftCluster}>
      <button className={cn(HEADER.iconButton, "lg:hidden")} onClick={onMenuToggle}>
        <Menu className="size-5" />
      </button>
      <Breadcrumbs />
    </div>

    <div className={HEADER.centerCluster}>
      <CommandPaletteTrigger />
    </div>

    <div className={HEADER.rightCluster}>
      <StoreSelector />
      <LanguageToggle />
      <ThemeToggle />
      <NotificationCenter />
      <UserMenu />
    </div>
  </div>
</header>
```

### 8.3 Command Palette Trigger (pill-style)
```tsx
<button
  onClick={openCmdPalette}
  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
>
  <Search className="size-4 text-slate-400" />
  <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 text-left">Cari halaman atau aksi...</span>
  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px] font-mono text-slate-500">
    Ctrl K
  </kbd>
</button>
```

---

## 9. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Sidebar `bg-white` (light chrome) | Violates dark chrome policy | `bg-slate-900` |
| Sidebar active dengan `bg-indigo-600 solid` | Color competition dengan content | `bg-slate-700/60 + ring` |
| Header height ≠ `h-14` | Inconsistent | `h-14` standard |
| Header tanpa `sticky top-0` | Lost on scroll | Always sticky |
| Header tanpa backdrop blur | Flat overlay | `backdrop-blur-sm` + `bg-*/80` |
| Active link tanpa visual affordance | A11y fail | Min: bg change + (optional) ring or bold |
| Inactive link warna sama dengan background | Invisible | Min contrast `text-slate-400` |
| Sidebar items hardcoded (tidak role-aware) | Security issue | Filter via `role` check |
| Mobile drawer tanpa close-on-navigate | Sticky drawer | Auto close after link click |
| Command palette hanya via visible trigger | Keyboard power-user fail | Global `Ctrl+K` listener |
| Mobile nav tanpa hamburger trigger | No escape on mobile | Always include hamburger |
| Icon size di nav ≠ `size-5` | Scale variance | `size-5` (20px) standard |
| Breadcrumbs di mobile full-length | Overflow | Truncate atau show last 2 segments |

---

## 10. Migration Guide

### 10.1 Active Link Pattern Unification
Audit existing active patterns:
- Sidebar → ensure `bg-slate-700/60 + ring` (not indigo solid)
- Mode toggles (Owner/Inv./Kasir switcher) → indigo solid OK
- In-content tabs → soft indigo

### 10.2 Mobile Nav Introduction
Current: only 2 `lg:hidden`. Target:
- Add hamburger to Header (mobile)
- Create drawer trigger state
- Ensure Sidebar works in drawer mode
- Breadcrumb truncate on mobile

### 10.3 Command Palette Global Listener
Ensure `Ctrl+K` works globally (not only when focus di trigger). Add event listener di layout root.

### Per-page priority
1. **PortalTemplate** (hosts Sidebar + Header) — main chrome
2. **All pages** — ensure they integrate Header properly
3. **Mobile adaptation** across semua page

### Code Review Rubric
1. Sidebar `bg-white` atau light chrome? → **reject**
2. Active link tanpa visual affordance? → **reject**
3. Header tanpa `sticky top-0`? → **request change**
4. Mobile nav tanpa hamburger? → **reject**
5. Command palette tanpa global listener? → **request change**
6. Icon size non-standard di nav? → **request change**
7. Role-aware filter missing? → **reject** (security)

---

## 11. Future Enhancements

- [ ] Pin/favorite nav items (user customization)
- [ ] Recently visited pages section di CommandPalette
- [ ] Sidebar mini hover tooltips saat collapsed
- [ ] Global search (beyond command palette) with fuzzy matching
- [ ] Keyboard-first navigation (arrow keys in sidebar)
- [ ] Nav item badges (unread count per section)
- [ ] Contextual nav per role (admin-only groups collapsed)
- [ ] Skip-to-content link (a11y)
- [ ] Breadcrumb schema.org structured data (SEO)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
