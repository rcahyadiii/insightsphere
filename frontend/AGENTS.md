# AGENTS.md â€” Frontend Scope (InsightSphere)

Scope: seluruh file di `frontend/`. Pedoman di `AGENTS.md` root tetap berlaku;
file ini menambahkan konteks spesifik frontend.

## 1. Stack & Struktur

- Framework: Next.js (App Router di `frontend/src/app/`).
- State / data: panggil API backend via helper di `frontend/src/lib/`.
- Styling: ikut konvensi yang sudah ada (Tailwind / CSS modules / token system).
- Test: Playwright (`*.test.mjs`) di `frontend/tests/`.

## 2. Skill Pack yang Wajib Dirujuk

- Komponen UI generik â†’ `SKILL/The FullStack Developer Pack/frontend-developer/SKILL.md`.
- Sistem desain & token â†’ `SKILL/The Web Designer Pack/frontend-design/`.
- Halaman, layout, micro-interaction â†’ `SKILL/The Web Designer Pack/ui-ux-pro-max/`.
- Layar mobile (POS kasir, POS mobile cart) â†’ `SKILL/The Web Designer Pack/mobile-design/`.
- Animasi scroll / parallax (landing, marketing) â†’ `SKILL/The Web Designer Pack/scroll-experience/`.
- Chart / dashboard kanvas â†’ `SKILL/The Web Designer Pack/canvas-design/`.
- Experience 3D (jika ada modul 3D) â†’ `SKILL/The Web Designer Pack/3d-web-experience/`.

## 3. Konvensi Kode

- Komponen: `PascalCase.tsx`. Hook: `useThing.ts`. Util: `camelCase.ts`.
- Hindari `any`. Selalu deklarasikan tipe untuk props & API response.
- Jangan tulis fetch URL hardcoded. Pakai helper di `src/lib/api/` atau `src/lib/config/`.
- Komponen presentational tidak fetch data sendiri; gunakan container / page sebagai data owner.

## 4. Routing & Akses

- Aturan policy route ada di test `frontend/tests/integration/route-policy.test.mjs`. Tambah test kalau menambah route baru.
- Halaman yang butuh auth / role tertentu â†’ ikut pola guard yang sudah ada (cek `src/app/` existing).

## 5. Testing

- Test integrasi (logika lintas-modul, kontrak API mock) â†’ `frontend/tests/integration/`.
- Test UI (visual, interaksi DOM, keyboard) â†’ `frontend/tests/ui/`.
- Saat menambah feature baru, minimal tambah satu test di folder yang sesuai.
- Test lama bernama `hardcode-*` adalah audit untuk mendeteksi nilai hardcoded; jangan hapus tanpa konfirmasi.

## 6. Larangan

- Jangan tambah dependency di `frontend/package.json` tanpa cek redundansi dengan root `package.json`.
- Jangan commit `.next/`, `node_modules/`, `.playwright-cli/` (sudah ter-cover `.gitignore`).
- Jangan inline-kan token desain (warna, spacing) tanpa lewat sistem token yang sudah ada.
- Jangan panggil endpoint backend yang belum punya kontrak Pydantic di backend.

## 7. Saat Menambah Halaman / Modul

Urutan kerja yang direkomendasikan:

1. Konfirmasi kontrak API di backend sudah ada & ada response schema.
2. Tambah type/interface di `src/lib/types/` (atau lokasi types existing).
3. Buat container/page yang owner data, lalu komponen presentational.
4. Tambah test di `frontend/tests/integration/` (kontrak) dan/atau `frontend/tests/ui/` (interaksi).
5. Update navigation/route policy kalau perlu.
