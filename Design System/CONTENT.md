# ✍️ InsightSphere Content Guidelines

> **Single source of truth untuk voice, tone, dan microcopy patterns.**
> Versi: 1.0 — 23 April 2026
> Companion specs: `TERMINOLOGY.md` (glossary), `I18N.md` (multi-language)

---

## 1. Overview

Consistent content = konsistensi brand + trust + clarity. Tanpa guidelines, tiap developer menulis gaya berbeda → user bingung.

**Goals:**
- 🎯 **Consistent tone** di seluruh app (login → toast → error)
- 🎯 **Clear actions** (user tahu apa yang akan terjadi)
- 🎯 **Empathetic errors** (jangan blame user)
- 🎯 **Efficient copy** (minimal words, maximum clarity)

---

## 2. Brand Voice

### 2.1 InsightSphere Personality

| Trait | Meaning | Example |
|---|---|---|
| **Helpful, bukan bossy** | Panduan, bukan perintah | ✅ "Coba lagi" <br> ❌ "HARUS ULANGI" |
| **Ringkas, bukan singkat** | Hemat kata, tapi lengkap | ✅ "Produk berhasil disimpan" <br> ❌ "OK" |
| **Profesional, bukan formal kaku** | Bisnis-friendly | ✅ "Mohon isi data" <br> ❌ "Dimohon kiranya Bapak/Ibu berkenan melengkapi data tersebut" |
| **Empatik, bukan defensif** | Akui masalah, tawarkan solusi | ✅ "Maaf, terjadi kesalahan. Tim kami sedang memperbaiki." <br> ❌ "Server error. Try again." |
| **Lokal, bukan direct-translate** | Bahasa Indonesia natural | ✅ "Masuk" <br> ❌ "Log In" |

### 2.2 We Sound Like...
- Rekan bisnis yang helpful (bukan chatbot)
- Penjelas yang sabar (bukan developer terminal)
- Guide friendly (bukan pemilik toko galak)

### 2.3 We Don't Sound Like...
- ❌ Corporate jargon ("synergy", "leverage", "optimize")
- ❌ Overly casual ("Hai bro!", "Oke oke!")
- ❌ Tech-speak ("Null reference exception", "403 Forbidden")
- ❌ Sarcasm / passive-aggressive ("Ya sudah jelas dong")

---

## 3. Tone Modulation

Voice = permanent. Tone = context-sensitive.

| Context | Tone Level | Example |
|---|---|---|
| **Success** | Celebratory, brief | "Transaksi berhasil disimpan" |
| **Error (user fault)** | Gentle, corrective | "Password belum sesuai ketentuan" |
| **Error (system fault)** | Empathetic, apologetic | "Maaf, sistem sedang mengalami kendala" |
| **Warning** | Caring, urgent | "Stok hampir habis — siapkan restok" |
| **Info** | Neutral, factual | "Data diperbarui otomatis setiap 5 menit" |
| **Destructive confirm** | Serious, clear | "Produk akan dihapus permanen. Lanjutkan?" |
| **Empty state** | Encouraging | "Mulai dengan transaksi pertama Anda" |
| **Loading** | Transparent | "Memuat data..." (bukan "Tunggu") |
| **Auth failure** | Generic (security) | "Username atau password salah" |

---

## 4. Microcopy Patterns

### 4.1 Button Labels

**Rule: Verb-first, action-clear, Title Case (Bahasa Indonesia).**

| Context | ✅ Good | ❌ Avoid |
|---|---|---|
| Create | "Tambah Produk", "Buat Transaksi" | "OK", "Submit", "Tambah" (tanpa objek jika ada multi-entity ambigu) |
| Save changes | "Simpan Perubahan" | "Save", "OK", "Done" |
| Confirm action | "Konfirmasi Pembayaran" | "Yes", "Confirm" (tanpa context) |
| Cancel / Abort | "Batal" | "Cancel", "No", "Tutup" (jika maksudnya cancel) |
| Delete | "Hapus Produk" | "Delete", "Remove", "X" |
| Primary continue | "Lanjut ke Pembayaran" | "Next", ">>>" |
| Back / Previous | "Kembali" | "Back", "<<<" |
| Close (modal) | "Tutup" atau ghost X | "Close", "Dismiss" |
| View more | "Lihat Detail", "Lihat Semua" | "More", "..." |
| Download | "Unduh Laporan", "Ekspor ke Excel" | "Download", "Export" |

**Rules:**
- **Verb + Noun** format preferred: "Simpan Perubahan" > "Simpan" (kecuali context sudah jelas di heading).
- **Title Case** untuk button labels (not UPPERCASE per Typography v1.1).
- **Indonesian** default (support English via i18n keys — see I18N.md).
- **Hindari generic verbs** ("OK", "Done", "Submit") — tidak informative.

### 4.2 Form Field Labels

| Rule | Good | Bad |
|---|---|---|
| Noun-based, concise | "Nama Produk" | "Masukkan Nama Produk" |
| Title Case | "Alamat Email" | "alamat email" |
| Required marker | "Nama Lengkap *" + `aria-required` | (only asterisk tanpa aria) |
| Sentence helpers | Helper text below: "Gunakan huruf + angka, min 8 karakter" | Label: "Password (min 8 karakter)" (overloaded) |

**Pattern:**
```tsx
<FormField>
  <Label>Nama Produk *</Label>
  <Input placeholder="Contoh: Kertas HVS A4 80gr" />
  <HelperText>Nama akan ditampilkan di POS kasir.</HelperText>
</FormField>
```

### 4.3 Placeholder Text

**Rule: Contoh, bukan instruksi.**

| ✅ Good | ❌ Bad |
|---|---|
| `placeholder="Contoh: KHA-001"` | `placeholder="Masukkan SKU"` |
| `placeholder="user@email.com"` | `placeholder="Email"` (duplikat label) |
| `placeholder="Cari produk, SKU, atau kategori..."` | `placeholder="Search..."` |

**Rules:**
- **Example-based** (prefix "Contoh:" or realistic sample).
- **JANGAN duplicate label** (label says "Email", placeholder "email@example.com" not "Email").
- **Search input OK** descriptive ("Cari ...").
- **Never** pakai placeholder sebagai substitute untuk label (a11y fail).

### 4.4 Loading States

**Rule: Transparent, context-aware.**

| Context | Copy |
|---|---|
| Generic | "Memuat..." |
| Fetching data | "Memuat data transaksi..." |
| Saving | "Menyimpan..." |
| Uploading | "Mengunggah {fileName}..." |
| Processing | "Memproses pembayaran..." |
| Generating | "Menghasilkan laporan..." |
| Syncing (offline POS) | "Sinkronisasi data ke server..." |

**Rules:**
- **Verb bentuk -ing** ("Memuat" not "Muat").
- **Specific > generic** ("Menyimpan produk..." > "Menyimpan...").
- **Trailing "..."** untuk hint ongoing process.
- **Pair dengan `aria-busy={true}`** (A11y §5.4).

### 4.5 Empty States

**Rule: Outcome-focused, encouraging, actionable.**

**Template:**
```
[Icon / Illustration]
[Hook Headline — outcome-focused]
[Description — explain why empty + what to do]
[Primary CTA — single clear action]
```

**Examples:**

✅ **Inventaris empty:**
```
[Package icon]
Mulai Kelola Stok Anda
Tambahkan produk pertama untuk mulai tracking stok dan menjual di POS.
[Tambah Produk Pertama]
```

✅ **Laporan no data:**
```
[BarChart icon]
Belum Ada Transaksi Minggu Ini
Data akan muncul setelah ada transaksi di POS kasir.
[Ke Kasir]
```

❌ **Bad:**
```
No data
```

❌ **Bad (passive-aggressive):**
```
Kosong. Silakan tambah data.
```

### 4.6 Error Messages

**Template: What happened + Why (opsional) + Next step.**

#### 4.6.1 Validation Errors (user fault — gentle)
| Situation | ✅ Good | ❌ Bad |
|---|---|---|
| Required field empty | "Nama produk wajib diisi" | "Required" |
| Email invalid | "Format email tidak valid (contoh: nama@email.com)" | "Invalid email" |
| Password too short | "Password minimal 8 karakter" | "Too short" |
| Duplicate SKU | "SKU ini sudah digunakan. Gunakan kode lain." | "Duplicate" |
| Wrong format | "Nomor telepon harus angka (contoh: 08123456789)" | "Format error" |

#### 4.6.2 System Errors (server fault — empathetic)
| Situation | ✅ Good |
|---|---|
| Network failure | "Koneksi terputus. Periksa internet Anda, lalu coba lagi." |
| Server error 500 | "Sistem sedang mengalami kendala. Tim kami sudah diberi tahu." |
| Timeout | "Permintaan terlalu lama. Coba lagi atau periksa koneksi." |
| Session expired | "Sesi Anda berakhir. Silakan masuk kembali." |
| Unauthorized | "Anda tidak memiliki izin untuk tindakan ini." |

#### 4.6.3 Auth Errors (generic — security)
| Situation | ✅ Good (secure) | ❌ Bad (enumeration attack) |
|---|---|---|
| Wrong password | "Username atau password salah" | "Password salah" |
| User not found | "Username atau password salah" | "User tidak ditemukan" |
| 2FA failed | "Kode verifikasi tidak valid. Coba lagi." | "Wrong 2FA code" |
| Rate limited | "Terlalu banyak percobaan. Coba lagi dalam {X} menit." | Silent fail |

### 4.7 Success Messages (Toast)

**Rule: Singkat, action-focused, past tense.**

| Situation | ✅ Good |
|---|---|
| Produk disimpan | "Produk berhasil disimpan" |
| Transaksi dibayar | "Pembayaran berhasil • Rp 150.000" |
| User diundang | "Undangan terkirim ke user@email.com" |
| Data disinkronkan | "3 transaksi disinkronkan ke server" |
| File di-ekspor | "Laporan diunduh (laporan-april-2026.xlsx)" |
| Password diubah | "Password berhasil diubah" |

**Rules:**
- **Max 1 line** (toast not modal).
- **Past tense** — action completed ("disimpan" not "menyimpan").
- **Optional context** dengan dot separator ("Berhasil • Rp 150.000").
- **Specific > generic** ("Produk berhasil disimpan" > "Berhasil").
- **Auto-dismiss 4 detik** untuk success (lihat TOASTS.md).

### 4.8 Confirmation Dialogs

**Template: Clear outcome + irreversibility + confirm label.**

**Destructive pattern:**
```
Title: "Hapus [Entity]?"
Body: "Tindakan ini tidak dapat dibatalkan. {Entity} "{Name}" akan dihapus permanen."
Buttons: [Batal] [Hapus Permanen]
```

**Examples:**

✅ **Hapus produk:**
```
Hapus Produk?
Produk "Kertas HVS A4" akan dihapus permanen dari inventaris. Tindakan ini tidak dapat dibatalkan.
[Batal] [Hapus Permanen]
```

✅ **End shift:**
```
Tutup Shift?
Setelah shift ditutup, transaksi tidak bisa ditambahkan ke shift ini. Pastikan semua transaksi sudah selesai.
[Batal] [Tutup Shift]
```

❌ **Bad:**
```
Are you sure?
OK / Cancel
```

**Rules:**
- **Title: question + entity** ("Hapus Produk?").
- **Body: consequence + irreversibility hint**.
- **Primary CTA: verb + entity** ("Hapus Permanen" > "OK").
- **Destructive = rose/destructive variant**.
- **Cancel = outline/ghost**, never primary.
- **Default focus to Cancel** (safer default).

### 4.9 Onboarding / First-Time Hints

**Rule: Welcoming, no condescension.**

| Context | ✅ Good |
|---|---|
| First login | "Selamat datang di InsightSphere! Mari siapkan toko Anda dalam 3 langkah." |
| First feature use | "Tip: Gunakan Ctrl+K untuk akses cepat ke fitur apapun." |
| Progressive feature | "Fitur baru: Prediksi stok dengan AI. [Coba Sekarang]" |

### 4.10 Notifications (In-App)

**Template: Actor + Action + Object + Time**

| Good | Bad |
|---|---|
| "Admin mengubah stok Kertas A4 (100 → 150) • 5 menit lalu" | "Stock updated" |
| "Sistem mendeteksi stok rendah: Tinta Hitam (2 tersisa) • Baru saja" | "Low stock warning" |

---

## 5. Number / Date / Currency Display

### 5.1 Currency (Rupiah)

**Standard format:** `Rp 1.500.000` (spasi setelah Rp, titik separator ribuan).

| ✅ Good | ❌ Bad |
|---|---|
| `Rp 1.500.000` | `Rp1,500,000` (no space, wrong separator) |
| `Rp 1.500.000,50` | `Rp 1.500.000.50` |
| `-Rp 50.000` (debit) | `Rp -50.000` |
| Compact: `Rp 1,5 Jt` | `Rp 1.5M` (English) |

**Pattern (via `charts.ts` helper):**
```ts
formatRupiah(1500000)    // "Rp 1.500.000"
formatRupiah(1500, { compact: true })  // "Rp 1,5 Rb"
formatRupiah(1500000, { compact: true }) // "Rp 1,5 Jt"
formatRupiah(1500000000, { compact: true }) // "Rp 1,5 M"
```

**Indonesian compact abbreviation:**
| Range | Abbreviation |
|---|---|
| 1.000 – 999.999 | `Rb` (Ribu) |
| 1.000.000 – 999.999.999 | `Jt` (Juta) |
| 1.000.000.000+ | `M` (Milyar) |

### 5.2 Dates

**Format by context:**
| Context | Format | Example |
|---|---|---|
| Timestamp full | `23 April 2026, 13:45` | `23 April 2026, 13:45` |
| Date only | `23 April 2026` | `23 April 2026` |
| Compact | `23 Apr 2026` | `23 Apr 2026` |
| Relative (recent) | "Baru saja", "5 menit lalu", "2 jam lalu", "Kemarin" | |
| Relative (older) | Fallback ke absolute date | |

**Pattern:**
```ts
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

format(date, "d MMMM yyyy, HH:mm", { locale: id })        // "23 April 2026, 13:45"
formatDistanceToNow(date, { locale: id, addSuffix: true }) // "5 menit lalu"
```

### 5.3 Numbers

| Context | Format | Example |
|---|---|---|
| Integer | Thousand separator | `1.500` |
| Decimal | Comma separator | `3,14` |
| Percentage | `%` suffix, no space | `85%`, `-2,5%` |
| Large numbers (compact) | Indonesian abbrev | `1,5 Jt` |
| Quantity with unit | Number + space + unit | `150 pcs`, `5 kg` |

### 5.4 Time (Duration)

| Context | Format |
|---|---|
| Short | "5 menit", "2 jam", "3 hari" |
| Detail | "2 jam 15 menit" |
| Countdown | "5:23" (mm:ss) atau "1:05:23" (h:mm:ss) |

---

## 6. Label Patterns

### 6.1 Section Headings

| Section | Pattern | Example |
|---|---|---|
| Page h1 | Entity/function (noun phrase) | "Inventaris", "Laporan Penjualan" |
| Section h2 | Grouping noun | "Informasi Umum", "Preferensi" |
| Subsection h3 | Specific context | "Kontak Darurat", "2FA" |
| Card title | Data type | "Transaksi Terakhir", "Produk Terlaris" |
| KPI label | Metric name | "Pendapatan", "Margin Kotor" |
| Filter label | Attribute | "Kategori", "Status", "Periode" |

### 6.2 Column Headers (Table)

**Rule: Noun, Title Case, concise.**

| ✅ Good | ❌ Bad |
|---|---|
| "SKU" | "Kode Produk (SKU)" |
| "Nama Produk" | "Produk" (ambiguous), "Name" |
| "Stok" | "Jumlah Stok Tersedia" |
| "Harga Jual" | "Price" |
| "Status" | "Keadaan", "State" |

### 6.3 Status Labels

| Value | Label | Badge Variant |
|---|---|---|
| `active` | "Aktif" | success (emerald) |
| `inactive` | "Tidak Aktif" | neutral (slate) |
| `pending` | "Menunggu" | warning (amber) |
| `completed` | "Selesai" | success |
| `failed` | "Gagal" | destructive (rose) |
| `cancelled` | "Dibatalkan" | neutral |
| `draft` | "Draft" | neutral |
| `low_stock` | "Stok Rendah" | warning |
| `out_of_stock` | "Habis" | destructive |
| `in_stock` | "Tersedia" | success |

---

## 7. Tone of Urgency (Alert Banners)

| Level | Visual | Copy Example |
|---|---|---|
| **Info** | Blue banner | "Mode offline aktif — transaksi akan disinkronkan saat online" |
| **Success** | Emerald banner | "Semua transaksi berhasil disinkronkan (3 transaksi)" |
| **Warning** | Amber banner | "Stok kertas hampir habis — pertimbangkan restok" |
| **Destructive** | Rose banner | "Koneksi database terputus. Fitur terbatas." |

**Rules:**
- **Single clear message** per banner.
- **Action hint** kalau relevan ("pertimbangkan restok").
- **Optional CTA button** di kanan ("Tutup", "Lihat Detail").
- **Don't stack** banners — pilih yang paling urgent.

---

## 8. Capitalization Rules

Per Typography v1.1 §3.3, **minimal uppercase**. Sentence Case default.

| Element | Case | Example |
|---|---|---|
| **Page h1** | Title Case | "Laporan Penjualan" |
| **Section h2** | Title Case | "Informasi Umum" |
| **Button labels** | Title Case | "Simpan Perubahan" |
| **Menu items** | Sentence case | "Pengaturan akun" |
| **Body text** | Sentence case | "Produk berhasil disimpan" |
| **Placeholder** | Sentence case | "Cari produk..." |
| **Table headers** | Title Case | "Nama Produk" |
| **Form labels** | Title Case | "Alamat Email" |
| **Badges** | Title Case | "Aktif", "Stok Rendah" |
| **Toast** | Sentence case | "Produk berhasil disimpan" |

**Exception (pre-approved UPPERCASE):**
- Acronyms: "SKU", "POS", "PPN", "AI", "KPI"
- Status codes: "404", "500" (literal numbers anyway)
- Dropdown label (`DROPDOWN.label` token — micro utility)

**DILARANG UPPERCASE:**
- ❌ Button CTA ("SIMPAN" → "Simpan")
- ❌ Tab labels ("DASHBOARD" → "Dashboard")
- ❌ KPI labels ("PENDAPATAN" → "Pendapatan")
- ❌ Tracking-widest + uppercase combo

---

## 9. Punctuation Policy

| Mark | Rule |
|---|---|
| **Period `.`** | End of sentences. **No period** di button labels, headings, single-line toasts, labels. |
| **Colon `:`** | After label inside sentence. "Status: Aktif" |
| **Ellipsis `...`** | Loading states, truncation, continue indicator |
| **Em dash `—`** | Separator di timestamps, compound clauses — prefer regular dash `-` if unsure |
| **Ampersand `&`** | ❌ Avoid in formal copy. "dan" lebih baik |
| **Exclamation `!`** | Sparingly — only genuine celebration ("Selamat datang!") |
| **Question `?`** | Confirmation titles ("Hapus Produk?"), help text |

**Rules:**
- **No trailing period** di button label ("Simpan" not "Simpan.").
- **Toast 1-line: no period**.
- **Description/body text: period wajib**.

---

## 10. Accessibility Writing

### 10.1 Alt Text
Refer `A11Y.md §9.1`:
- Informative image: describe content.
- Decorative: `alt=""`.
- Complex (chart): short alt + long description link.

### 10.2 ARIA Labels (Icon-only Buttons)
```tsx
<button aria-label="Hapus produk">
  <Trash2 aria-hidden="true" />
</button>
```
Match label dengan user expectation action.

### 10.3 Screen Reader Friendly Numbers
```tsx
// Bad: screen reader reads "1500000"
<span>{1500000}</span>

// Good: formatted for both visual + screen reader
<span>{formatRupiah(1500000)}</span>
// → "Rp 1.500.000" (screen reader reads as "Rupiah satu juta lima ratus ribu")
```

### 10.4 Form Error Announcement
```tsx
{error && (
  <p id={`${id}-error`} role="alert" className="text-rose-600 text-xs mt-1">
    {error}
  </p>
)}
```

---

## 11. 🚫 Prohibited Patterns

| Pattern | Why | Fix |
|---|---|---|
| ❌ "Klik di sini" sebagai link text | Tidak descriptive untuk screen reader | "Lihat detail produk" |
| ❌ "Loading..." tanpa context | Tidak informative | "Memuat data transaksi..." |
| ❌ Error dengan kode teknis ("ECONNREFUSED") | User tidak paham | "Koneksi terputus. Periksa internet." |
| ❌ UPPERCASE button labels | Typography v1.1 ban | Title Case |
| ❌ "Are you sure?" tanpa context | Generic | "Hapus Produk?" |
| ❌ "OK" button sebagai primary | Generic | Verb + noun ("Simpan Perubahan") |
| ❌ English placeholder di form ID | Mixed language | "Cari produk..." |
| ❌ Apologizing repeatedly | Over-apology | Apologize once, focus on solution |
| ❌ Blaming user ("You entered wrong data") | Hostile | "Data belum sesuai. Periksa kembali." |
| ❌ Tech jargon ("API timeout") | Ambiguous | "Sistem merespons terlalu lama" |
| ❌ Emoji overload 🎉🎊✨ | Unprofessional | Minimal emoji, only where meaningful |
| ❌ Direct translate "thank you" → "terima kasih" di semua konteks | Kadang janggal | Context-aware (sometimes just close with action confirm) |

---

## 12. Review Checklist

Per content piece, validate:

- [ ] **Tone** — matches context (success/error/warning/info)
- [ ] **Voice** — helpful, ringkas, empatik
- [ ] **Clarity** — user tahu apa yang terjadi + next step
- [ ] **Brevity** — minimal words, maximum info
- [ ] **Indonesian** — natural, bukan translate kaku
- [ ] **Capitalization** — sesuai Typography v1.1
- [ ] **No jargon** — understandable oleh non-tech user
- [ ] **Action-oriented** — verb + noun di CTA
- [ ] **Accessible** — ARIA label where icon-only
- [ ] **Localizable** — use i18n key, tidak hardcoded string

---

## 13. Migration Guide

### 13.1 Audit Findings (current state)
- **111 hardcoded `"Rp "`** — centralize ke `formatRupiah()`
- **63 `toLocaleString`** — inconsistent, migrate ke centralized formatter
- **24 "Error:" prefix** strings — refactor untuk empathetic tone
- **5 "Gagal" vs 20 "Berhasil"** — asymmetric error coverage
- **42 `step` references** — consolidate copy di Stepper component

### 13.2 Priority Fixes
1. **Error messages audit** — all 24 "Error:" strings → empathetic tone
2. **Currency formatting centralize** — migrate 111 hardcoded Rp to helper
3. **Button label consistency check** — verify all use Title Case + verb+noun
4. **Toast message audit** — ensure past-tense success, present for loading
5. **Empty state copy review** — all pake hook headline + CTA

### 13.3 Per-page Priority
1. **Auth pages** (Login error handling) — security critical
2. **POS KasirPage** — most frequent user interaction, error-prone
3. **InventarisPage** — heavy form + validation errors
4. **Modal flows** — PaymentModal, RefundModal, StockUpdateModal
5. **DashboardPage** — KPI labels, date formatting

---

## 14. Future Enhancements

- [ ] Content linter — detect banned phrases in code
- [ ] Translation memory system (i18n)
- [ ] A/B test microcopy variants
- [ ] Professional copywriter review pass
- [ ] Content style guide export (PDF untuk non-dev team)
- [ ] Chatbot/AI assistant voice alignment
- [ ] Email/notification copy alignment
- [ ] Print-receipt copy style

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
