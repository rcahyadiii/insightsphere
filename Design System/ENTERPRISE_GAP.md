# 🏢 InsightSphere Enterprise Readiness — Gap Assessment

> **Single source of truth untuk tracking enterprise-grade maturity design system.**
> Versi: 1.0 — 23 April 2026
> Related: semua spec di `Design System/` folder.

---

## 1. Executive Summary

### 1.1 Overall Score: **47%** (56/120 weighted points)

| Maturity Tier | Score Range | Description |
|---|:---:|---|
| **L1 — Prototype** | 0–30% | Ad-hoc styling, no tokens, no documentation |
| **L2 — Internal Product** | 30–55% | Foundation tokens + core components, per-team usage |
| **L3 — Multi-Product** | 55–80% | Patterns, content, governance — scales across teams |
| **L4 — External-Facing** | 80–95% | Full Storybook, Figma sync, public docs site |
| **L5 — Industry Leader** | 95%+ | Carbon, Polaris, Spectrum, Material Design |

**InsightSphere saat ini: L2 → transitioning to L3.**

### 1.2 Strengths (di atas rata-rata enterprise)

- ✅ **Foundation tokens** (Typography, Colors, Spacing, Radii, Elevation, Motion) — 85% coverage
- ✅ **Component breadth** — 24 spec docs, 11 token files
- ✅ **A11y horizontal meta-spec** — WCAG 2.1 AA policy formalized
- ✅ **Semantic color system** — role-based, dark-mode pairing documented
- ✅ **Migration rubrics** — per-spec code review checklist
- ✅ **Spec consistency** — similar structure across all 24 docs

### 1.3 Critical Gaps (blocker untuk L3+)

1. **Pattern library** — page templates, CRUD flows, wizards, error pages (2/10)
2. **Content guidelines** — voice & tone, microcopy, terminology (1/10)
3. **Tooling** — Storybook, Figma sync, visual tests, automated a11y (0/10)
4. **Governance** — versioning, deprecation, contribution workflow (2/10)
5. **Compliance UI** — UU PDP consent, cookie banner, terms flow (0/10)

---

## 2. Dimensi Enterprise Readiness

Evaluasi **12 dimensi** yang digunakan di industry benchmarks (Carbon, Polaris, Lightning, Spectrum, Material):

| # | Dimensi | Score | Benchmark L4 | Gap |
|---|---|:---:|:---:|:---:|
| 1 | Foundation tokens | 8/10 | 9/10 | -1 |
| 2 | Component breadth | 7/10 | 9/10 | -2 |
| 3 | Pattern library | 2/10 | 8/10 | **-6** 🔴 |
| 4 | Content guidelines | 1/10 | 8/10 | **-7** 🔴 |
| 5 | A11y (spec + exec) | 7/10 | 9/10 | -2 |
| 6 | i18n | 3/10 | 8/10 | **-5** 🔴 |
| 7 | Responsive/Device | 4/10 | 8/10 | -4 |
| 8 | Tooling (Storybook etc) | 0/10 | 9/10 | **-9** 🔴 |
| 9 | Governance / Versioning | 2/10 | 8/10 | **-6** 🔴 |
| 10 | Performance | 1/10 | 7/10 | -6 |
| 11 | Security UX | 2/10 | 7/10 | -5 |
| 12 | Compliance / Legal | 0/10 | 6/10 | -6 |

**Total: 37/120 baseline + 19 bonus (strong spec depth) = 56/120**

---

## 3. Detailed Gap Analysis

### 🔴 Gap 1: Pattern & Template Library (P0)

**Current:** Components documented, tapi tidak ada **page-level patterns** (reusable blueprints).

| Missing Pattern | Impact | Effort |
|---|:---:|:---:|
| Page templates (dashboard/list/detail/settings/form/wizard) | High | M |
| CRUD flow (list → create → edit → delete confirmation) | High | M |
| Master-detail layout (list + side panel) | High | S |
| Wizard / multi-step (onboarding, setup) | High | M |
| Search patterns (global/contextual/faceted filter) | Medium | S |
| Error pages (404/500/403) | High | S |
| Onboarding / first-run experience | Medium | M |
| Permission denied / access gated UI | Medium | S |
| Feature flags / gradual rollout UI | Low | S |

**Benchmark:** Carbon v11 has 15+ patterns, Polaris 25+, Atlassian 20+. InsightSphere has **0 formalized page patterns**.

**Resolve:** → `PATTERNS.md` (created alongside this doc)

### 🔴 Gap 2: Content Guidelines (P0)

**Current:** No content standards. Each developer writes ad-hoc copy.

| Missing | Impact | Effort |
|---|:---:|:---:|
| Voice & tone guide (formal/casual/friendly balance) | High | S |
| Microcopy patterns (error/empty/loading/success) | High | M |
| Button label conventions (verb-first, action-clear) | High | S |
| Error message template (what/why/how) | High | S |
| Confirmation copy (destructive vs non-destructive) | High | S |
| Terminology glossary (domain + role terms) | High | M |
| Loading state copy ("Memuat..." vs specific) | Medium | S |
| Empty state copy (hook + explanation + CTA) | Medium | S |
| Number/date/currency display patterns | Medium | S |

**Audit findings:**
- 111 hardcoded `"Rp "` (inconsistent — some use `toLocaleString`, some manual)
- 63 `toLocaleString`, 0 `Intl.NumberFormat` → mixed approach
- 5 "Gagal" vs 20 "Berhasil" → **asymmetric** error coverage
- No consolidated button label list (verbs inconsistent: "Simpan" / "Save" / "OK" / "Confirm")

**Resolve:** → `CONTENT.md` + `TERMINOLOGY.md`

### 🔴 Gap 3: Component Specs yang Belum Ada (P1)

| Component | Used in Code? | Severity |
|---|:---:|:---:|
| **Date/Time Picker** | shadcn Calendar ada, spec belum | High |
| **Combobox / Autocomplete** | Hand-rolled, tidak konsisten | High |
| **File Upload / Dropzone** | Ad-hoc (ExcelImportModal) | High |
| **Accordion / Collapsible** | Hand-rolled beberapa tempat | Medium |
| **Slider / Range input** | Tidak dipakai | Low |
| **Tree view** | Tidak dipakai | Low |
| **Carousel** (shadcn ada) | 0 usage | Low |
| **Pagination** (shadcn ada + helper) | Partial doc di TABLES | Medium |
| **Stepper** (partial di TABS) | 42 `step` references | Medium |

**Resolve:** Individual specs (DATETIME.md, COMBOBOX.md, UPLOAD.md, etc.) — prioritize High severity first.

### 🟡 Gap 4: Responsive / Device Support (P1)

**Current audit:** 278 responsive modifier instances (sm:70, md:78, lg:97, xl:30, 2xl:3). Strictly mobile-first (0 max-* modifier).

| Missing | Impact |
|---|:---:|
| Breakpoint scale formal tokens | High |
| Mobile-first vs desktop-first policy | High |
| Responsive design principles doc | High |
| Touch vs mouse interaction differences | Medium |
| Print stylesheet (only 2 `window.print`, 0 `@media print`) | Medium for POS/Laporan |
| Device matrix (min/max resolution, supported browsers) | Medium |
| Orientation handling (landscape POS tablet) | Low |
| Container queries adoption policy | Low |

**Resolve:** → `RESPONSIVE.md` + `responsive.ts` tokens

### 🔴 Gap 5: Internationalization (i18n) (P1)

**Current:** Backend + frontend both support dual Indonesian + English, but **next-intl is NOT wired up** (0 `useTranslations` calls, 0 next-intl imports). i18n infrastructure planned but deferred per Phase 5 architecture.

| Missing | Impact |
|---|:---:|
| i18n spec (guidelines for translators) | High |
| Locale-specific formatting centralized | High (111 hardcoded `Rp `) |
| Pluralization rules | Medium |
| Text expansion policy (ID ~30% longer than EN) | High |
| Translation key naming convention | High |
| RTL support (future: Arabic market?) | Low |
| Language switcher UI pattern | Medium |
| Date formatting consistency (63 `toLocaleString` mixed) | High |

**Resolve:** → `I18N.md`

### 🔴 Gap 6: Governance & Versioning (P1)

| Missing | Impact |
|---|:---:|
| Design system semver policy | High |
| Deprecation policy (grace period) | High |
| Contribution guide (propose/review workflow) | High |
| Change log format (per-release notes) | High |
| RFC process for major changes | Medium |
| Design ↔ Dev handoff workflow | Medium |
| Code review rubric consolidated | Medium (partial per-spec) |
| Owner/approver matrix | Medium |

**Resolve:** → `GOVERNANCE.md` (future)

### 🔴 Gap 7: Tooling & Infrastructure (P0/P1)

**Current: 0/10 — this is the biggest L4-blocker.**

| Tool | Status | Industry Standard |
|---|:---:|:---:|
| **Storybook / playground** | ❌ | Carbon, Polaris, all L4 |
| **Figma library sync** | ❌ | Carbon Design Kit, Polaris UX |
| **Visual regression** (Chromatic/Percy) | ❌ | Carbon CI |
| **Automated a11y** (axe-core in CI) | ❌ | Polaris, Atlassian |
| **Component usage analytics** | ❌ | Carbon Core Dashboard |
| **Bundle size tracking** | ❌ | Polaris ships size-limit |
| **ESLint rules DS-specific** | ❌ | `eslint-plugin-polaris` style |
| **Design tokens export** (W3C DTCG format) | ❌ | Carbon ships `.json` + Style Dictionary |
| **CLI code generators** | ❌ | `npx @carbon/create` |

**Resolve:** Separate roadmap doc — these are dev infra, not spec. **~4-6 weeks effort for MVP Storybook + axe CI.**

### 🟡 Gap 8: Security / Trust UX (P2)

| Missing | Impact |
|---|:---:|
| Authentication UI patterns (Login/2FA/Reset/Signup) | High |
| Session timeout warning UI | High |
| Sensitive data masking (card last-4, PII) | High |
| Audit trail display pattern | Medium |
| Destructive action confirmation | Partial (MODALS) |
| Permission/RBAC UI state | Partial (RBAC exists but not spec'd) |

**Resolve:** → `AUTH_PATTERNS.md` (future)

### 🔴 Gap 9: Compliance / Legal UI (P0 for ID market)

**Indonesia UU PDP 2022 requires consent UI for PII processing. Currently 0 coverage.**

| Missing | Impact |
|---|:---:|
| UU PDP consent UI (opt-in, granular permissions) | **Legal requirement** |
| Cookie consent banner | Legal requirement |
| Terms/Privacy acceptance flow | Legal requirement |
| Data export / right to be forgotten UI | Legal (UU PDP) |
| Accessibility statement page | Recommended (WCAG) |

**Resolve:** → `COMPLIANCE.md` (future, consult legal)

### 🟡 Gap 10: Performance (P2)

| Missing | Impact |
|---|:---:|
| Performance budgets per page | Medium |
| Bundle size target per route | Medium |
| Image optimization policy | Medium |
| Lazy loading policy | Medium |
| Animation 60fps budget | Partial (MOTION) |
| Web Vitals targets (LCP/FID/CLS) | Medium |

**Resolve:** → `PERFORMANCE.md` (future)

### 🟡 Gap 11: Data Handling UX (P1)

| Missing | Impact |
|---|:---:|
| Pagination vs infinite scroll policy | Partial (TABLES) |
| Sort/Filter consolidated patterns | Partial |
| Bulk actions pattern | Missing |
| Export/Import patterns (ExportShareModal ada, pattern?) | Partial |
| Optimistic updates guidelines | Missing |
| Offline sync UI (PWA POS) | Missing |
| Real-time indicator (live dot, last-updated) | Missing |

**Resolve:** → `DATA_UX.md` (future) or extend TABLES.md

---

## 4. Prioritization Matrix

Prioritas berdasarkan **impact × effort × urgency**:

### P0 — Blocker untuk L3, execute dalam 2-4 minggu

| # | Deliverable | Effort | Unblocks |
|---|---|:---:|---|
| 1 | `PATTERNS.md` (9 core patterns) | 2 weeks | Team productivity |
| 2 | `CONTENT.md` + `TERMINOLOGY.md` | 1 week | Consistency |
| 3 | `RESPONSIVE.md` + `responsive.ts` | 1 week | Mobile UX |
| 4 | `I18N.md` | 1 week | Multi-language |
| 5 | Storybook MVP setup | 2 weeks | Tooling L3 |

**Total: ~6-8 weeks parallel work.**

### P1 — L3 → L4 transition, 4-8 minggu

| # | Deliverable | Effort |
|---|---|:---:|
| 6 | `DATETIME.md`, `COMBOBOX.md`, `UPLOAD.md` | 2 weeks |
| 7 | `GOVERNANCE.md` | 1 week |
| 8 | `AUTH_PATTERNS.md` | 1 week |
| 9 | axe-core + Playwright a11y CI | 1 week |
| 10 | Execute migrations (50 form htmlFor, 87 chart hex, 100+ alerts) | 3 weeks |
| 11 | Dark mode 100% execution | 2 weeks |

### P2 — L4 → L5, 3-6 bulan

| # | Deliverable |
|---|---|
| 12 | Figma library sync |
| 13 | Visual regression tests (Chromatic) |
| 14 | Component analytics dashboard |
| 15 | Design tokens W3C export |
| 16 | ESLint plugin InsightSphere-specific |
| 17 | Public docs site |
| 18 | `COMPLIANCE.md` + UU PDP consent UI |
| 19 | `PERFORMANCE.md` + budgets |

### P3 — Aspirational L5

- RFC process
- External contributor guide
- Multi-brand theming
- Container queries migration
- RTL support (Arabic market)

---

## 5. Success Metrics

Tracking KPI untuk DS adoption + quality:

### 5.1 Adoption Metrics
- **Token usage rate** — % files import dari `lib/*.ts` vs hardcoded
  - Target: 80% files (currently ~30% estimated)
- **Hand-rolled component ratio** — `<button bg-*>` vs `btn()`
  - Target: <10% hand-rolled (currently ~30% = 111 of 376 buttons)
- **Shadcn primitive usage** — `<Dialog>` adoption
  - Target: 100% (currently ~60% — 7 hand-rolled modals remain)

### 5.2 Quality Metrics
- **Lighthouse a11y score** — per-page
  - Target: ≥95 (currently unknown — no baseline)
- **Dark mode coverage** — page-level
  - Target: 100% (currently 28%)
- **Visual regression pass rate** — not yet set up
  - Target: >99% (blocked on Chromatic)
- **Contrast failures** — WCAG AA audit
  - Target: 0 (currently unknown)

### 5.3 Velocity Metrics
- **New page setup time** — minutes from blank to styled dashboard
  - Baseline target: <30 min dengan pattern templates
- **Component customization rate** — % usage with `className` override
  - Target: <20% (high override = spec too rigid)

### 5.4 Governance Metrics
- **Deprecation lead time** — days between deprecate notice → remove
  - Target: ≥60 days
- **Breaking change frequency** — per quarter
  - Target: ≤1 major release/quarter

---

## 6. Roadmap

### Q2 2026 (April–June) — **L3 Transition**
- ✅ A11Y.md + a11y.ts (done)
- ✅ CHARTS.md + charts.ts (done)
- 🔄 **PATTERNS.md + CONTENT.md + TERMINOLOGY.md + RESPONSIVE.md + I18N.md** ← *this batch*
- ⏳ Execute critical migrations (form htmlFor, chart hex, alerts)
- ⏳ Dark mode 60% → 85%
- ⏳ Storybook MVP

### Q3 2026 (July–September) — **L3 Consolidation**
- ⏳ `DATETIME.md`, `COMBOBOX.md`, `UPLOAD.md`
- ⏳ `GOVERNANCE.md` + semver policy
- ⏳ `AUTH_PATTERNS.md`
- ⏳ axe-core CI
- ⏳ Component analytics baseline
- ⏳ Dark mode 100%

### Q4 2026 (October–December) — **L4 Preparation**
- ⏳ Figma library sync
- ⏳ `COMPLIANCE.md` + UU PDP UI
- ⏳ `PERFORMANCE.md` + budgets
- ⏳ Visual regression tests
- ⏳ W3C DTCG token export

### 2027 — **L4 Launch**
- Public docs site
- External contributor RFC
- Multi-product adoption tracking

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| Spec bloat — too many specs, no one reads | High | High | Single-entry navigation + cross-reference + rubrics |
| Migration work stalls — specs remain aspirational | High | High | Per-spec migration checklist + code review enforcement |
| Dark mode execution incomplete | Medium | Medium | Dedicated refactor sprint |
| i18n never wired up | Medium | High | Phase 5 dependency — defer spec to when infra ready |
| Storybook maintenance overhead | Medium | Medium | Start minimal (core 20 components), expand iteratively |
| Content guidelines ignored by devs | High | Medium | Link from every error handler + toast call |
| Legal (UU PDP) compliance missed | Low | **Critical** | Consult legal Q3 |
| Performance regression from token adoption | Low | Low | Measured — tokens = string literals, no runtime cost |

---

## 8. Benchmarks (Industry Reference)

### 8.1 IBM Carbon v11 (L5)
- 70+ components, 15+ patterns, 5 themes
- Figma + Sketch libraries
- Storybook + React + Angular + Vue + Web Components
- 3000+ contributors, public GitHub
- W3C DTCG compliant token export

### 8.2 Shopify Polaris v13 (L5)
- 60+ components, 25+ patterns
- Dedicated content guidelines section
- eslint-plugin-polaris ships
- Figma UX Kit + App Kit
- Public docs at polaris.shopify.com

### 8.3 Salesforce Lightning (L5)
- 100+ components
- Comprehensive accessibility guide
- SLDS Validator tool
- Design tokens in SASS/Less/CSS
- Public docs + Lightning Design Tokens

### 8.4 InsightSphere (L2→L3)
- **24 spec docs, 11 token files**
- **0 patterns, 0 Storybook, 0 Figma sync**
- **Strong spec depth, weak infrastructure**
- **Target: Reach Polaris-level L4 within 12 months**

---

## 9. Immediate Next Actions (Next 2 Weeks)

Priority order for current session + follow-up:

1. ✅ **Create `ENTERPRISE_GAP.md`** (this doc) — baseline assessment
2. 🔄 **Create `PATTERNS.md`** — 9 core page patterns
3. 🔄 **Create `CONTENT.md`** — voice/tone + microcopy
4. 🔄 **Create `TERMINOLOGY.md`** — glossary bahasa fotokopian
5. 🔄 **Create `RESPONSIVE.md`** + `responsive.ts` tokens
6. 🔄 **Create `I18N.md`** — i18n guidelines
7. ⏳ Update IA doc + memory
8. ⏳ Next session: Storybook setup + axe CI

---

**Owner:** faiz
**Last assessment:** 23 April 2026
**Next review:** Q3 2026 (July)
