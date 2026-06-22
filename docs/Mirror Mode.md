# Mode Cermin (Mirror Mode)

> Dokumen ini adalah satu-satunya rujukan otoritatif untuk fitur Mode Cermin di InsightSphere. Update setiap kali ada perubahan kontrak atau perilaku.

## 1. Tujuan

Mode Cermin memungkinkan Admin memverifikasi tampilan dan akses role lain (Owner, Manajer Inventaris, Kasir) tanpa logout/login ulang. Fitur ini dipakai untuk audit konfigurasi RBAC, troubleshoot pengguna, dan demo internal.

Prinsip:

- **Read-only by default.** Admin tidak boleh melakukan mutasi atas nama role lain. Backend menolak semua write yang melalui sesi cermin aktif.
- **Always observable.** Setiap aktivasi/deaktivasi/blok dicatat di `audit_events` dengan IP dan User-Agent.
- **Time-boxed.** Sesi otomatis berakhir setelah TTL (`MIRROR_SESSION_TTL_MINUTES`, default 30 menit).
- **Single active per actor.** Hanya satu sesi cermin aktif per user, di-enforce DB partial unique index.

## 2. Aktor

| Aktor | Hak |
| --- | --- |
| Admin | Boleh `start`, `stop`, dan `read` sesi cermin sendiri. Read view-as role lain tetap. |
| Owner / Inventory Manager / Kasir | Tidak boleh start. Endpoint `GET /auth/mirror` mengembalikan `null` saat dipanggil non-admin. |

## 3. Alur

```mermaid
flowchart LR
    A[Admin login] --> B[Klik tombol role di sidebar]
    B --> C[POST /auth/mirror]
    C -->|201 + sesi| D[Banner + watermark muncul, RBAC FE pakai target_role]
    D --> E{Admin coba write}
    E -->|allowed paths /auth/mirror, /auth/logout, /auth/refresh| F[Lewat]
    E -->|jalur lain| G[403 MIRROR_READ_ONLY + audit MIRROR_BLOCKED]
    D --> H[Klik "Keluar Mode Cermin" / tekan Esc]
    H --> I[DELETE /auth/mirror]
    I -->|204 + audit MIRROR_STOP manual| J[Banner hilang]
    D --> K{Sesi expires_at lewat?}
    K -->|ya, panggilan GET berikutnya| L[Backend auto end + audit MIRROR_STOP expired]
```

## 4. API Reference

Semua endpoint hidup di `/auth/mirror` (FastAPI di `backend/domains/identity/router.py`). Frontend Next.js memforward ke backend lewat `frontend/app/api/auth/mirror/route.ts` dengan header `User-Agent` dan `X-Forwarded-For` browser.

### `GET /auth/mirror`

- **Tujuan:** ambil sesi aktif untuk admin saat ini.
- **Auth:** Bearer token admin.
- **Response 200:** `MirrorSessionResponse` atau `null` jika tidak ada / non-admin.

### `POST /auth/mirror`

- **Tujuan:** mulai/replace sesi cermin.
- **Auth:** Bearer token admin. Non-admin → 403.
- **Body:** `{ "target_role": "owner" | "inventory_manager" | "cashier" }`.
- **Behavior:** kalau ada sesi aktif, di-end manual dulu, lalu sesi baru di-create. Tulis audit `MIRROR_START`.
- **Rate limit:** 10/menit per IP (slowapi).
- **Response 201:** `MirrorSessionResponse`.

### `DELETE /auth/mirror`

- **Tujuan:** keluar Mode Cermin (idempotent).
- **Auth:** Bearer token admin.
- **Behavior:** kalau ada sesi aktif, set `ended_at + end_reason='manual'`. Tulis audit `MIRROR_STOP`.
- **Response 204.**

### `MirrorSessionResponse`

```json
{
  "id": "uuid",
  "actor_user_id": "uuid",
  "actor_role": "admin",
  "target_role": "owner | inventory_manager | cashier",
  "started_at": "ISO8601",
  "expires_at": "ISO8601"
}
```

## 5. Skema Database

`mirror_sessions` (Alembic revision `c3d4e5f6a7b8`):

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | UUID | PK, default `gen_random_uuid()` |
| `actor_user_id` | UUID | FK ke `users.id`, ON DELETE CASCADE |
| `actor_role` | varchar(50) | Snapshot role pada saat aktivasi |
| `target_role` | varchar(50) | `owner`, `inventory_manager`, `cashier` |
| `started_at` | timestamptz | default `now()` |
| `expires_at` | timestamptz | `started_at + TTL` |
| `ended_at` | timestamptz | null saat aktif |
| `end_reason` | varchar(32) | `manual`, `expired` |
| `ip_address` | varchar(45) | dari `X-Forwarded-For` paling kiri kalau ada |
| `user_agent` | text | UA browser yang diteruskan Next API route |

Index:

- `ix_mirror_sessions_actor_user_id` (regular)
- `ix_mirror_sessions_actor_active` (unique partial: `WHERE ended_at IS NULL`)

`audit_events` menyimpan tiga `event_type` Mode Cermin:

- `MIRROR_START`: `event_data` minimal `actor_user_id`, `actor_role`, `target_role`, `session_id`, `ip_address`, `user_agent`.
- `MIRROR_STOP`: tambah `end_reason` (`manual`/`expired`).
- `MIRROR_BLOCKED`: tambah `method`, `path`, `block_ip`, `block_user_agent` saat write request ditolak middleware.

## 6. Frontend

| Komponen | Fungsi |
| --- | --- |
| `frontend/src/app/components/MirrorModeBanner.tsx` | Banner top viewport (`role="status"`, `aria-live`), watermark portal (kanan-bawah, `Z.toast`), countdown MM:SS dari `expires_at`, listener `Esc`. |
| `frontend/src/app/components/Sidebar.tsx` | Panel "Mode Cermin" dengan tombol Owner/Inv./Kasir; tombol exit dipindah ke banner. |
| `frontend/src/app/context/AuthContext.tsx` | `useQuery(["auth","mirror"])` hidrate state lintas reload; `switchView` async; expose `mirrorSession` di context. |
| `frontend/src/app/lib/auth-client.ts` | `fetchMirrorSession`, `startMirrorSession`, `stopMirrorSession`. |
| `frontend/app/api/auth/mirror/route.ts` | Proxy GET/POST/DELETE; forward `Authorization`, `User-Agent`, `X-Forwarded-For`. |

i18n keys:

- `mirror.banner.viewing_as`, `mirror.banner.description`, `mirror.banner.exit`, `mirror.banner.exit_hint`, `mirror.banner.countdown_label`.
- `mirror.read_only.toast`, `mirror.read_only.desc`.
- `nav.mirror.mode`, `nav.mirror.exit`, `header.mirror`.

## 7. Read-Only Enforcement

`backend/core/mirror_middleware.py` adalah satu-satunya sumber kebenaran. Logika:

1. Skip method non-write.
2. Skip path allowlist (`/auth/mirror`, `/auth/logout`, `/auth/refresh`).
3. Decode bearer token. Bukan admin → skip.
4. Lookup user dari DB (override `get_db` saat test).
5. Cek `mirror_service.get_active_session`. Kalau None → skip.
6. Catat audit `MIRROR_BLOCKED` (IP, UA, method, path) lalu return `403 MIRROR_READ_ONLY`.

`MIRROR_WRITABLE_PATHS = ()` adalah extension point untuk kasus impersonate writable (mis. fitur testing). Tambahan harus melalui review governance, bukan default.

## 8. Audit & Governance

- Retention: ikut tabel `audit_events` (saat ini tidak dibatasi; rekomendasi tambah retention policy).
- Reviewer: tim security/compliance internal sebaiknya mengaudit `MIRROR_*` minimal mingguan.
- Escalation: kalau ditemukan `MIRROR_BLOCKED` di production dengan pola tinggi, treat sebagai indikator UI bug atau attempt.

Query audit dasar:

```sql
SELECT timestamp, event_type, event_data
FROM audit_events
WHERE event_type LIKE 'MIRROR_%'
ORDER BY timestamp DESC
LIMIT 50;
```

```sql
SELECT actor_role, target_role, started_at, expires_at, ended_at, end_reason
FROM mirror_sessions
ORDER BY started_at DESC
LIMIT 25;
```

## 9. Testing

| Layer | Path | Cakupan |
| --- | --- | --- |
| Unit pytest | `backend/tests/domains/test_identity_mirror.py` | start/replace/expire, audit `MIRROR_BLOCKED`, read-only enforcement. |
| Integration pytest (real Postgres) | `backend/tests/integration/test_mirror_postgres.py` | partial unique index + JSONB filter. |
| Rate limit pytest | `backend/tests/test_rate_limit.py` | 429 burst di `/auth/login` dan `/auth/forgot-password`. |
| E2E Playwright | `frontend/tests/e2e/mirror-mode.spec.ts` | Login admin → switch ke Owner → banner + watermark → write 403 → exit. |

## 10. FAQ

**Q: Kenapa `user_agent` di audit kadang `node`?**  
A: Jika request datang dari sisi server Next.js tanpa forward header, UA jatuh ke default `node`. Phase 1 menambahkan forwarding di `app/api/auth/mirror/route.ts`. Di production pastikan reverse proxy juga meneruskan `User-Agent`.

**Q: Apakah Admin bisa melihat sesi user lain?**  
A: Tidak. Endpoint `GET /auth/mirror` hanya mengembalikan sesi milik user yang authenticated.

**Q: Bagaimana kalau Admin reload browser?**  
A: `useQuery(["auth","mirror"])` rehydrate state dari backend. Banner muncul kembali tanpa input ulang.

**Q: Apakah Mode Cermin bypass 2FA?**  
A: Tidak. Login awal admin tetap melalui flow 2FA. Sesi mirror hanya menambah header viewport state, tidak mengubah JWT.

## 11. Future Work

- Forwarding UA real saat request internal Next-server (sebagian sudah, perlu audit semua write proxy).
- ~~Retention policy `audit_events` (90 hari rolling).~~ helper `find_audit_events_older_than` di `backend/domains/identity/mirror_observability.py` (default 90 hari, scope `MIRROR_*` only). Eksekusi schedule (delete batch) belum ditambahkan — baru read helper.
- Diagram alur sebagai PNG/SVG (saat ini Mermaid inline).
- Opt-in writable path eksplisit untuk skenario testing yang sah.
- ~~Monitoring alert kalau `MIRROR_BLOCKED` di production melebihi threshold.~~ helper `count_recent_blocked` + `evaluate_blocked_alert` di `backend/domains/identity/mirror_observability.py` (default window 60 menit, threshold 25). Wiring ke alerting (PagerDuty/Slack) belum dilakukan.

## 12. Referensi Cepat

- Backend: `backend/domains/identity/mirror_service.py`, `backend/core/mirror_middleware.py`.
- Migrasi: `backend/alembic/versions/c3d4e5f6a7b8_add_mirror_sessions.py`.
- Frontend banner: `frontend/src/app/components/MirrorModeBanner.tsx`.
- API proxy: `frontend/app/api/auth/mirror/route.ts`.
- Tracker progress: `docs/Project Health Tracker.md`.