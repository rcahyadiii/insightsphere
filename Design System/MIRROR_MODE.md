# MIRROR MODE — Design System Reference

> Dokumen UI tokens & rules untuk fitur Mode Cermin. Untuk perilaku end-to-end (API, audit log, governance) lihat `docs/Mirror Mode.md`.

## Color Palette

Mode Cermin pakai keluarga warna **amber** (warning) supaya tidak bertabrakan dengan brand active state (indigo).

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| Banner background | `bg-amber-50` | `dark:bg-amber-900/30` | Container banner top viewport |
| Banner border | `border-amber-200` | `dark:border-amber-700/40` | Garis bawah banner |
| Banner text | `text-amber-900` | `dark:text-amber-200` | Teks utama dan ikon |
| Eye icon background | `bg-amber-200/60` | `dark:bg-amber-800/60` | Ikon mata di banner & watermark |
| Exit button background | `bg-white` | `dark:bg-amber-950/40` | Tombol "Keluar Mode Cermin" |
| Exit button border | `border-amber-300` | `dark:border-amber-700/60` | Garis tombol exit |
| Watermark background | `bg-amber-50/90` | `dark:bg-amber-900/40` | Pill kanan-bawah viewport |
| Countdown background | `bg-amber-100/60` | `dark:bg-amber-900/30` | Pill MM:SS di banner |

Hindari mengganti ke `emerald` atau `indigo` — keduanya bermakna lain di sistem (sukses, brand active).

## Layout Rules

- **Banner** memakai layout flex dua kolom (info kiri, action kanan) di dalam `max-w-[1920px]` container, sama seperti Header. Mobile (`< sm`) menyembunyikan deskripsi sekunder.
- **Watermark** dirender via `createPortal` ke `document.body` dengan `position: fixed bottom-4 right-4`, `pointer-events-none`, `Z.toast`. Tidak boleh menyatu di dalam shell layout supaya konsisten lintas halaman dan saat scroll.
- **Watermark mobile (<sm)** disembunyikan (`hidden sm:block`) supaya tidak menabrak POS mobile cart bar (`KasirPage` `fixed inset-x-3 bottom-...`) atau Sonner toast top-right. Banner top tetap muncul sebagai cue utama.
- **Sidebar Mirror Panel** berada di antara nav dan user profile, hanya muncul kalau `actualRole === admin`.

## Accessibility

- Banner: `role="status"` + `aria-live="polite"` agar screen reader mendapat update saat sesi cermin berubah.
- Watermark: `aria-hidden="true"` (redundan untuk visual user; banner sudah membawa state untuk SR).
- Tombol exit: `title` berisi `mirror.banner.exit_hint` (`"Tekan Esc atau klik untuk keluar Mode Cermin."`). Banner mendaftarkan listener keydown global untuk `Esc`, tapi skip jika fokus di input/textarea/contenteditable.
- Countdown: `tabular-nums` agar angka tidak gemetar tiap detik.
- Kontras dark mode (WCAG): teks `amber-200` (#fde68a) di atas `amber-900/30` yang ditumpuk pada `slate-950` ≈ 12:1; watermark `amber-100` (#fef3c7) di atas `amber-900/40` over `slate-950` ≈ 12:1. Keduanya melewati AA normal text (≥4.5:1) dan AAA (≥7:1). Border amber 200/300/700 murni dekoratif (non-text), tidak terikat threshold AA. Verifikasi manual lewat Chrome DevTools (Inspect → Accessibility → Contrast) saat berubah palette.

## Tokens dan File Implementasi

| Token kategori | Source | Catatan |
| --- | --- | --- |
| `Z.toast` | `frontend/src/app/lib/elevation.ts` | dipakai untuk watermark |
| `R.lg`, `R.full` | `frontend/src/app/lib/radii.ts` | radius banner / watermark |
| `T.body`, `T.bodySm`, `T.caption`, `T.buttonSm` | `frontend/src/app/lib/typography.ts` | konsisten lintas banner |
| `A11Y.focusRing.default` | `frontend/src/app/lib/a11y.ts` | tombol exit |

## Anti-pattern

- Jangan menyalin warna amber ke komponen lain tanpa konteks Mode Cermin.
- Jangan render banner di dalam scroll container — banner harus selalu tampak.
- Jangan tambah tombol exit kedua di sidebar atau halaman; satu tombol di banner adalah single source.
- Jangan ganti label tombol role dengan singkatan ambigu (mis. `Inv.`); pakai `t(\`um.role.${r}\`)`.

## Lihat juga

- `docs/Mirror Mode.md` — perilaku, audit log, governance, FAQ.
- `docs/Project Health Tracker.md` — progres dan gap.