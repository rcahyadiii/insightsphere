# 📋 RENCANA IMPLEMENTASI: Backend Alignment dengan PRD Frontend

**Dibuat:** 18 April 2026  
**Target:** Align backend dengan PRD Frontend (12 items)  
**Total Effort:** ~5-6 hari kerja (realistic)

---

## 🚀 PHASE 1: URGENT (Hari 1-2) — Block Frontend Integration

### ✅ ITEM #1: Add User Profile Fields
**Deskripsi:** Tambah email, phone, position, avatar_url ke User model  
**Effort:** 45 menit  
**Files:** 
- `backend/domains/identity/models.py` — extend User
- `backend/domains/identity/schemas.py` — update UserResponse + UserCreate
- Migration/alter table users

**Perubahan Detail:**
```python
# User Model (add fields)
email: str (unique, nullable untuk existing users)
phone: Optional[str]
position: Optional[str]  # Jabatan: Pemilik, Manajer, Gudang, Kasir
avatar_url: Optional[str]  # URL ke uploaded avatar

# Schemas
class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    phone: Optional[str]
    position: Optional[str]
    role: RoleEnum
    avatar_url: Optional[str]
    is_active: bool
```

**Dependencies:** None  
**Testing:** `POST /auth/register-admin` return 200 + all fields present

---

### ✅ ITEM #2: Create Store Management Table & API
**Deskripsi:** CRUD table untuk multi-branch store config  
**Effort:** 1 jam  
**Files:**
- `backend/domains/inventory/models.py` — add Store model
- `backend/domains/inventory/schemas.py` — StoreCreate, StoreResponse
- `backend/domains/inventory/router.py` — endpoints
- `backend/domains/inventory/service.py` — business logic

**Endpoints:**
```
GET    /api/inventory/stores                  # List all stores
GET    /api/inventory/stores/{store_id}       # Get detail
POST   /api/inventory/stores                  # Create
PUT    /api/inventory/stores/{store_id}       # Update
DELETE /api/inventory/stores/{store_id}       # Deactivate (soft delete)
```

**Store Model:**
```python
class Store(Base):
    __tablename__ = "stores"
    
    id: UUID (PK)
    store_number: int (unique, FK constraint)
    name: str                    # Nama Cabang
    address: str
    phone: str
    website: Optional[str]
    city: Optional[str]
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]  # Soft delete
    
    # Relations
    sales_transactions = relationship("SalesTransaction")
```

**Permissions:**
- admin + owner: Full CRUD
- cashier: GET only (own store)

**Dependencies:** None  
**Testing:** 
- POST create store → 201 + UUID returned
- GET all stores (admin) → 200 list
- GET all stores (cashier) → 200 filtered (own store only)

---

### ✅ ITEM #3: Clarify Role Mapping & Add Missing Roles
**Deskripsi:** Align PRD semantic roles dengan backend, add "inventory_manager"  
**Effort:** 30 menit  
**Files:**
- `backend/core/security.py` — update RoleEnum
- `backend/domains/identity/schemas.py` — update RoleEnum
- Documentation update

**Current Enum:**
```python
class RoleEnum(str, Enum):
    ADMIN = "admin"          # System admin (keep)
    OWNER = "owner"          # Business owner (keep)
    CASHIER = "cashier"      # Cashier (keep)
```

**Proposed Mapping:**
```python
class RoleEnum(str, Enum):
    ADMIN = "admin"                    # Pemilik: Full system access
    OWNER = "owner"                    # Manajer: Branch manager, can create/delete users, see all branches
    INVENTORY_MANAGER = "inventory_manager"  # Gudang: Inventory CRUD only
    CASHIER = "cashier"                # Kasir: POS transactions, own branch only
```

**Update Role Filters:**
```python
require_owner_or_admin = RequireRole(["admin", "owner"])
require_inventory = RequireRole(["inventory_manager", "admin", "owner"])
require_all_roles = RequireRole(["admin", "owner", "inventory_manager", "cashier"])
```

**Dependencies:** Item #2 (Store)  
**Testing:** 
- Login as each role
- Verify `/auth/me` returns correct role
- Verify inventory endpoints enforce role check

---

## ⏳ PHASE 2: HIGH (Hari 2-3) — Core Features

### ✅ ITEM #4: Notification API Infrastructure
**Deskripsi:** Create notification domain + endpoints  
**Effort:** 2 jam  
**Files:**
- `backend/domains/notification/` — new domain
  - `models.py` — Notification model
  - `schemas.py` — NotificationCreate, NotificationResponse
  - `router.py` — GET, mark-read, delete
  - `service.py` — business logic
- `backend/main.py` — register router
- `backend/domains/notification/enums.py` — NotificationType

**Notification Model:**
```python
class Notification(Base):
    __tablename__ = "notifications"
    
    id: UUID (PK)
    user_id: UUID (FK → User)
    type: str  # "anomaly", "critical", "prediction", "opportunity", "system"
    title: str
    message: str
    severity: str  # "critical", "warning", "info"
    icon: str  # emoji atau icon name
    is_read: bool = False
    action_url: Optional[str]  # link to `/penjelasan-ai`, `/inventaris`, etc
    created_at: datetime
    updated_at: datetime
    
    # Relation
    user = relationship("User", back_populates="notifications")
```

**Endpoints:**
```
GET    /api/notifications                 # List (with filters: all, unread, critical)
POST   /api/notifications/{id}/read       # Mark as read
DELETE /api/notifications/{id}            # Delete
POST   /api/notifications/mark-all-read   # Mark all as read
```

**Event Trigger (Mock untuk sekarang):**
```python
# Di endpoint tertentu, trigger notifikasi:
- Saat prediksi diupdate → anomaly notification
- Saat stok kritis → critical notification
- Saat forecast berubah > threshold → warning notification
```

**Dependencies:** Item #1 (User fields)  
**Testing:**
- POST create notification → user melihatnya di GET
- Mark read → is_read = True
- Filter by severity works

---

### ✅ ITEM #5: Login Activity Audit Trail
**Deskripsi:** Track setiap login untuk security audit  
**Effort:** 1.5 jam  
**Files:**
- `backend/domains/identity/models.py` — add LoginActivity model
- `backend/domains/identity/router.py` — add middleware/hook
- `backend/domains/identity/service.py` — create_login_activity function
- `backend/core/security.py` — hook di get_current_user

**LoginActivity Model:**
```python
class LoginActivity(Base):
    __tablename__ = "login_activities"
    
    id: UUID (PK)
    user_id: UUID (FK → User)
    username: str
    ip_address: Optional[str]
    user_agent: Optional[str]  # Browser/device info
    device: Optional[str]  # "Web", "Mobile", etc
    success: bool = True
    failure_reason: Optional[str]  # jika login gagal
    login_at: datetime
    logout_at: Optional[datetime]
    
    # Relation
    user = relationship("User")
```

**Implementation:**
```python
# Di router login endpoint, after successful verification:
service.create_login_activity(
    user_id=user.id,
    username=user.username,
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent"),
    success=True
)

# Endpoint untuk GET riwayat:
GET /api/auth/login-history  # List 20 most recent logins
```

**Dependencies:** None  
**Testing:**
- Login 3x → GET /auth/login-history return 3 records
- Each record has timestamp + ip + user_agent

---

### ✅ ITEM #6: Export/Report API
**Deskripsi:** Endpoint untuk export sales, predictions, profit-loss, wastage  
**Effort:** 1.5 jam  
**Files:**
- `backend/domains/reporting/` — new domain
  - `models.py` — Report model (for scheduling)
  - `router.py` — POST /export, GET templates
  - `service.py` — generate reports
  - `utils.py` — PDF/CSV generation
- `backend/main.py` — register router

**Endpoints:**
```
POST   /api/reporting/export              # Generate export on-demand
GET    /api/reporting/templates           # List export templates
GET    /api/reporting/exports/{export_id} # Download file
```

**Export Types:**
```python
enum ExportType(str, Enum):
    SALES = "sales"           # Penjualan report
    PREDICTION = "prediction" # Prediksi stok
    PROFIT_LOSS = "profit_loss"
    WASTAGE = "wastage"
```

**Simple CSV approach:**
```python
def generate_sales_report(store_nbr: int, period: str) -> BytesIO:
    # Query data
    # Convert to pandas DataFrame
    # Write to CSV / Excel
    # Return BytesIO
    pass

# Response:
@router.post("/export")
def export_report(
    export_type: ExportType,
    period: str = "month",  # week, month, quarter, year
    store_nbr: Optional[int] = None
):
    file = generate_sales_report(...)
    return StreamingResponse(
        iter([file.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report.csv"}
    )
```

**Dependencies:** Item #2 (Store)  
**Testing:**
- POST with export_type=sales → 200 + CSV file
- File contains relevant data
- Can be opened in Excel

---

## ⏳ PHASE 3: MEDIUM (Hari 3-4) — User Experience

### ✅ ITEM #7: User Invitation & Email Flow
**Deskripsi:** Invite mechanism untuk tambah user baru  
**Effort:** 2 jam  
**Files:**
- `backend/domains/identity/models.py` — add UserInvite model
- `backend/domains/identity/router.py` — POST /invite-user, POST /accept-invite/{token}
- `backend/domains/identity/service.py` — email sending logic
- `backend/core/config.py` — SMTP config
- `.env.example` — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD

**UserInvite Model:**
```python
class UserInvite(Base):
    __tablename__ = "user_invites"
    
    id: UUID (PK)
    email: str
    token: str (unique, generated via secrets)
    role: RoleEnum
    invited_by_user_id: UUID (FK → User)
    accepted: bool = False
    accepted_at: Optional[datetime]
    expires_at: datetime  # 7 days from creation
    created_at: datetime
```

**Endpoints:**
```
POST   /api/auth/invite-user              # Send invitation (admin/owner only)
POST   /api/auth/accept-invite/{token}    # Create new user from invite
GET    /api/auth/invitations              # List pending invites (admin/owner)
DELETE /api/auth/invitations/{id}         # Revoke invite
```

**Email Template:**
```
Subject: Anda diundang ke SmartStock

Halo,

Anda telah diundang untuk bergabung dengan sistem SmartStock.
Klik link di bawah untuk membuat akun:

https://localhost:3000/accept-invite/{token}

Tautan berlaku selama 7 hari.

Jika ada pertanyaan, hubungi admin.
```

**Dependencies:** Item #1 (email field), Celery (optional, untuk async email)  
**Testing:**
- POST invite → 200 + email sent (mock)
- Accept invite → new user created
- Expired token → 400 Bad Request

---

### ✅ ITEM #8: Password Reset & Change Password
**Deskripsi:** Forgot password + change password flow  
**Effort:** 1.5 jam  
**Files:**
- `backend/domains/identity/models.py` — add PasswordReset model
- `backend/domains/identity/router.py` — POST /forgot-password, /reset-password, /change-password
- `backend/domains/identity/service.py` — token generation + validation
- `.env` — RESET_TOKEN_EXPIRE_HOURS

**PasswordReset Model:**
```python
class PasswordReset(Base):
    __tablename__ = "password_resets"
    
    id: UUID (PK)
    user_id: UUID (FK → User)
    token: str (unique)
    used: bool = False
    expires_at: datetime
    created_at: datetime
```

**Endpoints:**
```
POST   /api/auth/forgot-password          # Request reset link
POST   /api/auth/reset-password/{token}   # Set new password via token
POST   /api/auth/change-password          # Authenticated user change password
```

**Forgot Password Flow:**
```python
@router.post("/forgot-password")
def forgot_password(email: str):
    user = get_user_by_email(email)
    if not user:
        return {"message": "Jika email terdaftar, kami akan kirim reset link"}
    
    token = generate_token()
    save_reset_token(user.id, token)
    send_reset_email(email, token)
    return {"message": "Reset link telah dikirim"}
```

**Change Password (for authenticated user):**
```python
@router.post("/change-password")
def change_password(
    current_pin: str,
    new_pin: str,
    current_user = Depends(get_current_user)
):
    if not verify_pin(current_pin, current_user.pin_hash):
        raise HTTPException(401, "PIN saat ini salah")
    
    new_hash = get_pin_hash(new_pin)
    update_user_pin(current_user.id, new_hash)
    return {"message": "Password berhasil diubah"}
```

**Dependencies:** Item #1 (email field)  
**Testing:**
- Request reset → token stored
- Reset with valid token → new password works
- Reset with expired token → 400
- Change password with wrong current PIN → 401

---

### ✅ ITEM #9: Email Integration (SMTP + Celery)
**Deskripsi:** Setup email sending infrastructure  
**Effort:** 2 jam  
**Files:**
- `backend/core/email.py` — new email service
- `backend/core/celery_app.py` — Celery config + email task
- `backend/domains/identity/tasks.py` — email tasks
- `.env` — SMTP credentials
- `docker-compose.yml` — Redis + Celery worker (optional)

**Email Service:**
```python
# backend/core/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    mail_from=settings.SMTP_USER,
    mail_password=settings.SMTP_PASSWORD,
    mail_from_name=settings.APP_NAME,
    mail_port=int(settings.SMTP_PORT),
    mail_server=settings.SMTP_HOST,
    mail_tls=True,
    mail_ssl=False
)

async def send_email(email: str, subject: str, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
```

**Celery Task (async):**
```python
# backend/domains/identity/tasks.py
from celery import shared_task

@shared_task
def send_invitation_email_task(email: str, token: str):
    # Generate link
    link = f"{settings.FRONTEND_URL}/accept-invite/{token}"
    body = f"Click here: {link}"
    send_email(email, "Undangan SmartStock", body)
```

**Usage in Router:**
```python
@router.post("/invite-user")
def invite_user(email: str, role: RoleEnum, current_user = Depends(require_owner_or_admin)):
    invite = create_user_invite(email, role, current_user.id)
    # Async send email
    send_invitation_email_task.delay(email, invite.token)
    return {"message": "Invitation sent"}
```

**Dependencies:** Item #7 (User Invitation)  
**Config:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

**Testing:** Mock email or test with real SMTP

---

## 🔮 PHASE 4: POLISH (Hari 4-5) — Advanced Features

### ✅ ITEM #10: 2FA Implementation (Two-Factor Authentication)
**Deskripsi:** TOTP-based 2FA (Google Authenticator)  
**Effort:** 3 jam  
**Files:**
- `backend/domains/identity/models.py` — add 2FA fields to User
- `backend/domains/identity/router.py` — POST /2fa/setup, /2fa/verify
- `backend/domains/identity/service.py` — TOTP logic
- Install: `pyotp`, `qrcode`

**User Model Extension:**
```python
class User(Base):
    # ... existing fields ...
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str]  # Encrypted TOTP secret
    backup_codes: Optional[str]  # JSON list of backup codes
```

**2FA Flow:**
```python
# 1. Enable 2FA (step 1: generate secret)
@router.post("/2fa/setup/init")
def setup_2fa_init(current_user = Depends(get_current_user)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    qr_uri = totp.provisioning_uri(name=current_user.email, issuer_name="SmartStock")
    
    # Generate QR code image
    qr = qrcode.QRCode()
    qr.add_data(qr_uri)
    qr.make()
    
    return {
        "secret": secret,
        "qr_image": qr_image_as_base64,
        "message": "Scan dengan Google Authenticator atau Microsoft Authenticator"
    }

# 2. Verify and save 2FA
@router.post("/2fa/setup/verify")
def setup_2fa_verify(
    secret: str,
    code: str,  # 6-digit code from authenticator
    current_user = Depends(get_current_user)
):
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(400, "Kode tidak valid")
    
    # Save secret (encrypted)
    user.two_factor_secret = encrypt(secret)
    user.two_factor_enabled = True
    db.commit()
    
    # Generate backup codes
    backup_codes = [str(uuid4())[:8] for _ in range(10)]
    return {"backup_codes": backup_codes, "message": "2FA enabled"}

# 3. Login with 2FA
@router.post("/login/verify-2fa")
def verify_2fa(
    username: str,
    pin: str,
    totp_code: str
):
    user = get_user_by_username(username)
    if not verify_pin(pin, user.pin_hash):
        raise HTTPException(401, "Invalid PIN")
    
    if user.two_factor_enabled:
        secret = decrypt(user.two_factor_secret)
        totp = pyotp.TOTP(secret)
        if not totp.verify(totp_code):
            raise HTTPException(401, "Invalid 2FA code")
    
    # Generate token
    token = create_access_token(...)
    return {"access_token": token}
```

**Dependencies:** Item #1 (email field)  
**Testing:**
- Setup 2FA → QR code generated
- Verify with wrong code → 400
- Verify with correct code → 2FA enabled
- Login without 2FA code when enabled → 401

---

### ✅ ITEM #11: WebSocket for Real-Time Notifications (Optional)
**Deskripsi:** Real-time notification push (optional, untuk UX better)  
**Effort:** 4 jam  
**Files:**
- `backend/core/websocket.py` — WebSocket manager
- `backend/domains/notification/websocket.py` — notification handler
- `backend/main.py` — register WebSocket route
- Install: `python-socketio`, `python-engineio`

**Simple WebSocket Setup (using FastAPI native):**
```python
# backend/core/websocket.py
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        del self.active_connections[user_id]
    
    async def broadcast_to_user(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(data)

# Usage in router:
@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming data
    except Exception:
        manager.disconnect(user_id)
```

**Trigger from notification creation:**
```python
# When notification created:
await manager.broadcast_to_user(user_id, {
    "type": "notification",
    "data": notification.dict()
})
```

**Dependencies:** Item #4 (Notification API)  
**Note:** Silahkan skip item ini untuk MVP; dapat ditambah nanti  

---

### ✅ ITEM #12: i18n API Responses (Multilingual Errors)
**Deskripsi:** Support multi-language error messages berdasarkan Accept-Language header  
**Effort:** 2 jam  
**Files:**
- `backend/core/i18n.py` — new i18n service
- `backend/core/exceptions.py` — custom exception classes
- Update all routers + security.py
- `backend/locales/` — translation files (id.json, en.json)

**i18n Service:**
```python
# backend/core/i18n.py
from typing import Dict

TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "id": {
        "auth.invalid_credentials": "Username atau PIN salah",
        "auth.token_expired": "Token sudah kadaluarsa",
        "auth.unauthorized": "Tidak memiliki akses",
    },
    "en": {
        "auth.invalid_credentials": "Invalid username or PIN",
        "auth.token_expired": "Token expired",
        "auth.unauthorized": "Unauthorized access",
    }
}

def get_message(key: str, lang: str = "id") -> str:
    return TRANSLATIONS.get(lang, {}).get(key, key)
```

**Custom Exception:**
```python
# backend/core/exceptions.py
class APIException(HTTPException):
    def __init__(self, status_code: int, message_key: str, lang: str = "id"):
        message = get_message(message_key, lang)
        super().__init__(status_code=status_code, detail=message)

# Usage:
raise APIException(401, "auth.invalid_credentials", lang=request.headers.get("accept-language", "id"))
```

**Extract Accept-Language:**
```python
# Middleware or dependency
def get_language(request: Request) -> str:
    lang = request.headers.get("accept-language", "id")
    # Parse "id-ID,id;q=0.9,en;q=0.8" → "id"
    return lang.split(",")[0].split("-")[0]

# Usage in router:
@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), lang: str = Depends(get_language)):
    if not user:
        raise APIException(401, "auth.invalid_credentials", lang=lang)
```

**Dependencies:** None  
**Testing:**
- Request with `Accept-Language: en` → error in English
- Request with `Accept-Language: id` → error in Indonesian

---

## 📊 SUMMARY TABLE

| Phase | Item | Effort | Priority | Status | Dependencies |
|-------|------|--------|----------|--------|--------------|
| 1 | User Profile Fields | 45m | URGENT | ✅ | None |
| 1 | Store Management API | 1h | URGENT | ✅ | None |
| 1 | Role Mapping | 30m | URGENT | ✅ | #2 |
| 2 | Notification API | 2h | HIGH | ⏳ | #1 |
| 2 | Login Audit | 1.5h | HIGH | ⏳ | None |
| 2 | Export/Report API | 1.5h | HIGH | ⏳ | #2 |
| 3 | User Invitation | 2h | MEDIUM | ⏳ | #1, #9 |
| 3 | Password Reset | 1.5h | MEDIUM | ⏳ | #1 |
| 3 | Email Integration | 2h | MEDIUM | ⏳ | #7 |
| 4 | 2FA Implementation | 3h | LOW | 🔮 | #1 |
| 4 | WebSocket Notifications | 4h | LOW | 🔮 | #4 |
| 4 | i18n API Responses | 2h | LOW | 🔮 | None |
| — | **TOTAL** | **~5-6 hari kerja** | — | — | — |

---

## 🎯 RECOMMENDED EXECUTION ORDER

```
DAY 1:
├─ #1: User Profile Fields (45m) ✅
├─ #2: Store Management API (1h) ✅
├─ #3: Role Mapping (30m) ✅
└─ Testing + commit (45m)

DAY 2:
├─ #4: Notification API (2h) ✅
├─ #5: Login Audit (1.5h) ✅
├─ #6: Export/Report API (1.5h) ✅
└─ Testing + integration test (1h)

DAY 3:
├─ #7: User Invitation Setup (1h) ✅
├─ #8: Password Reset (1.5h) ✅
├─ #9: Email Integration (2h) ✅
└─ Testing + E2E invitation flow (1.5h)

DAY 4:
├─ #10: 2FA Implementation (3h) ✅
├─ Testing 2FA flow (1h)
└─ Optimization + security review (2h)

DAY 5 (Optional/Polish):
├─ #11: WebSocket (4h) 🔮 OR
├─ #12: i18n (2h) 🔮
└─ Additional testing + documentation
```

---

## ✅ DEFINITION OF DONE (per item)

Setiap item dianggap **DONE** jika:
1. ✅ Code ditulis + tested locally
2. ✅ Endpoint testers di Swagger (atau curl)
3. ✅ Database migration dijalankan
4. ✅ No pylance errors
5. ✅ Git commit dengan message jelas
6. ✅ PR (jika menggunakan git flow)

---

## 🔗 BLOCKING CHECKLIST (untuk frontend integration)

Frontend tidak bisa mulai sampai items berikut 100% selesai:
- [x] #1: User Profile Fields
- [x] #2: Store Management API
- [ ] #4: Notification API (minimal GET endpoint)
- [ ] #7: User Invitation
- [ ] #9: Email Integration

Sisanya bisa proceed paralel atau post-MVP.

---

**Next:** Saya siap mulai implementasi. Mana yang mau kita prioritaskan dulu?
