# Rental Property Management API — Planning Guide

**Stack:** Node.js + TypeScript + Express
**Existing:** Auth (username/password + Google OAuth), bKash gateway integration
**Assumptions made below** (flag if wrong, easy to adjust):
1. Single property for now, but schema is designed so adding more properties later doesn't require a rewrite.
2. PostgreSQL + Prisma ORM (matches typical Node/TS relational-DB setups; swap for raw SQL/Sequelize/TypeORM if you're using something else — the schema/logic carries over).
3. File storage: local disk or S3-compatible bucket for room/shop photos and tenant documents (NID scans, signed agreements) — storing only the URL/key in DB.
4. NID numbers are sensitive — stored but access-restricted; full encryption-at-rest is a stretch goal, not a day-6 blocker.

---

## 1. Functional Requirements

**Tenant Management**
- FR1: Create/read/update/deactivate a `TenantProfile` (name, mobile, NID number, NID document images, present/permanent address, emergency contact).
- FR2: A `TenantProfile` can have multiple `RentalAgreement`s over time (same person can rent, leave, rent again, or rent a second unit).
- FR3: Search tenants by name, mobile, or NID number.

**Unit (Room/Shop) Management**
- FR4: Create/read/update/archive a `Unit`, typed as `ROOM` or `SHOP`.
- FR5: Rooms store an `occupancy_limit`; shops don't need one (or it's always 1) — but both store `dimensions`.
- FR6: Each unit has a base `monthly_rent` and a `security_deposit_amount` (range varies per unit).
- FR7: Upload/attach multiple photos and documents to a unit.
- FR8: Unit has a status: `VACANT`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`.

**Rental Agreement**
- FR9: Create a `RentalAgreement` linking a `TenantProfile` to a `Unit` — starts in `DRAFT` / `PENDING_PAYMENT` status. Unit status becomes `RESERVED`, **not** `OCCUPIED`, at this point.
- FR10: Agreement only becomes `ACTIVE` (and the unit becomes `OCCUPIED`) once the required security deposit/advance payment is **confirmed successful**. This is the core business rule you flagged — assignment happens after payment, not before.
- FR11: Store agreement terms: start date, end date (nullable for open-ended), monthly rent (can differ from unit's default if negotiated), deposit amount, agreement document (uploaded/signed PDF).
- FR12: Support agreement termination (manual, before end date) and expiry (automatic/flagged when end date passes) — unit reverts to `VACANT` (or `MAINTENANCE` if flagged for cleanup).

**Payments**
- FR13: Record payments against a tenant/agreement: type `SECURITY_DEPOSIT`, `ADVANCE`, `RENT`.
- FR14: Integrate with existing bKash flow — create a `Payment` record on initiation, update it via the bKash callback/webhook to `COMPLETED` or `FAILED`.
- FR15: On `COMPLETED` security-deposit/advance payment, atomically: mark payment complete → activate agreement → occupy unit. This must be a single DB transaction so you never end up with a paid tenant and a still-"reserved" unit (or vice versa).
- FR16: View payment history per tenant and per agreement.
- FR17: Support manual/cash payment recording too (not everything will go through bKash, e.g., legacy tenants or partial cash deposits).

**Media/Documents**
- FR18: Generic attachment system so photos/docs can hang off a `Unit`, `TenantProfile`, or `RentalAgreement` without three separate upload tables.

## 2. Non-Functional Requirements

- **NFR1 — Data integrity:** Payment confirmation → agreement activation → unit status change must be wrapped in a DB transaction (Prisma `$transaction`) to avoid partial state.
- **NFR2 — Idempotency:** bKash webhook/callback handler must be idempotent (a retried webhook call for the same transaction ID should not double-activate or double-charge).
- **NFR3 — Security/privacy:** NID numbers and documents are sensitive PII — restrict read access by role, avoid returning full NID in list endpoints (mask it, e.g. `XXXX-XXX-1234`), and don't log raw NID values.
- **NFR4 — Validation:** Strict request validation (e.g. `zod`) — especially around occupancy limits, dimension formats, and payment amounts.
- **NFR5 — Extensibility:** Unit table shouldn't hardcode room-only or shop-only fields in a way that blocks adding new unit types later.
- **NFR6 — Auditability:** Track `createdBy`/`updatedBy` and timestamps on agreements and payments — landlord disputes will happen and you'll want a paper trail.
- **NFR7 — Performance:** Fine at small scale (single property); just index foreign keys and status columns used for filtering.
- **NFR8 — Testability:** Core money-and-status-change logic (FR15) needs at least basic automated tests given how costly a bug there would be.

---

## 3. Tentative DB Schema (Prisma-style)

```prisma
model Property {
  id        String   @id @default(uuid())
  name      String
  address   String
  units     Unit[]
  createdAt DateTime @default(now())
}

enum UnitType {
  ROOM
  SHOP
}

enum UnitStatus {
  VACANT
  RESERVED
  OCCUPIED
  MAINTENANCE
}

model Unit {
  id                    String     @id @default(uuid())
  propertyId            String
  property              Property   @relation(fields: [propertyId], references: [id])
  unitNo                String
  type                  UnitType
  floor                 Int?
  lengthFt              Float?
  widthFt               Float?
  occupancyLimit        Int?       // rooms only; null/ignored for shops
  monthlyRent           Decimal
  securityDepositAmount Decimal
  status                UnitStatus @default(VACANT)
  agreements            RentalAgreement[]
  media                 Media[]
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  @@unique([propertyId, unitNo])
  @@index([status])
}

model TenantProfile {
  id                String   @id @default(uuid())
  fullName          String
  mobileNumber      String
  email             String?
  nidNumber         String   @unique
  presentAddress    String
  permanentAddress  String?
  emergencyContact  String?
  agreements        RentalAgreement[]
  payments          Payment[]
  media             Media[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([mobileNumber])
}

enum AgreementStatus {
  DRAFT
  PENDING_PAYMENT
  ACTIVE
  TERMINATED
  EXPIRED
}

model RentalAgreement {
  id                    String          @id @default(uuid())
  tenantProfileId       String
  tenant                TenantProfile   @relation(fields: [tenantProfileId], references: [id])
  unitId                String
  unit                  Unit            @relation(fields: [unitId], references: [id])
  status                AgreementStatus @default(DRAFT)
  startDate             DateTime
  endDate               DateTime?
  monthlyRent           Decimal
  securityDepositAmount Decimal
  activatedAt           DateTime?
  terminatedAt          DateTime?
  createdBy             String          // staff user id
  payments              Payment[]
  media                 Media[]
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([status])
}

enum PaymentType {
  SECURITY_DEPOSIT
  ADVANCE
  RENT
}

enum PaymentMethod {
  BKASH
  CASH
  BANK_TRANSFER
}

enum PaymentStatus {
  INITIATED
  COMPLETED
  FAILED
}

model Payment {
  id                String        @id @default(uuid())
  tenantProfileId   String
  tenant            TenantProfile @relation(fields: [tenantProfileId], references: [id])
  rentalAgreementId String?
  agreement         RentalAgreement? @relation(fields: [rentalAgreementId], references: [id])
  type              PaymentType
  method            PaymentMethod
  amount            Decimal
  bkashTransactionId String?      @unique
  status            PaymentStatus @default(INITIATED)
  paidAt            DateTime?
  createdAt         DateTime      @default(now())

  @@index([status])
  @@index([bkashTransactionId])
}

enum MediaOwnerType {
  UNIT
  TENANT_PROFILE
  RENTAL_AGREEMENT
}

enum MediaLabel {
  UNIT_PHOTO
  NID_FRONT
  NID_BACK
  AGREEMENT_DOCUMENT
  OTHER
}

model Media {
  id              String         @id @default(uuid())
  ownerType       MediaOwnerType
  unitId          String?
  unit            Unit?          @relation(fields: [unitId], references: [id])
  tenantProfileId String?
  tenant          TenantProfile? @relation(fields: [tenantProfileId], references: [id])
  rentalAgreementId String?
  agreement       RentalAgreement? @relation(fields: [rentalAgreementId], references: [id])
  label           MediaLabel
  fileUrl         String
  uploadedBy      String
  createdAt       DateTime       @default(now())
}
```

**Why `Payment.rentalAgreementId` is nullable:** the first security-deposit payment might be initiated slightly before/alongside agreement creation depending on your UX flow — keep it loose, then tighten with a DB constraint once your flow is locked.

---

## 4. Probable API Endpoints

**Tenants**
```
POST   /api/tenants                      Create tenant profile
GET    /api/tenants                      List/search tenants (?q=, ?mobile=)
GET    /api/tenants/:id                  Get tenant profile (NID masked unless elevated role)
PATCH  /api/tenants/:id                  Update tenant profile
GET    /api/tenants/:id/agreements       Agreement history for tenant
GET    /api/tenants/:id/payments         Payment history for tenant
```

**Units**
```
POST   /api/units                        Create room/shop
GET    /api/units                        List units (?type=ROOM|SHOP, ?status=)
GET    /api/units/:id                    Get unit detail (incl. media, current agreement)
PATCH  /api/units/:id                    Update unit
DELETE /api/units/:id                    Archive unit (soft delete)
```

**Rental Agreements**
```
POST   /api/agreements                   Create draft agreement (tenant + unit) → unit becomes RESERVED
GET    /api/agreements                   List (?status=, ?unitId=, ?tenantId=)
GET    /api/agreements/:id               Get agreement detail
PATCH  /api/agreements/:id               Update terms (only while DRAFT/PENDING_PAYMENT)
POST   /api/agreements/:id/terminate     Terminate active agreement → unit reverts to VACANT
POST   /api/agreements/:id/expire        Mark expired (or run as a scheduled job)
```

**Payments**
```
POST   /api/payments/bkash/initiate      Start bKash payment for a given agreement/tenant + type + amount
POST   /api/payments/bkash/callback      bKash webhook — verify, mark COMPLETED/FAILED
POST   /api/payments/manual              Record a cash/bank payment (staff-entered)
GET    /api/payments                     List (?tenantId=, ?agreementId=, ?status=)
GET    /api/payments/:id                 Get payment detail
```
> The `POST /api/payments/bkash/callback` handler is where FR15's transaction lives: verify signature/txn → `prisma.$transaction([updatePayment, updateAgreement, updateUnit])`.

**Media**
```
POST   /api/media                        Upload file, attach to ownerType + ownerId + label
GET    /api/media?ownerType=&ownerId=    List attachments for an entity
DELETE /api/media/:id                    Remove attachment
```

---

## 5. Six-Day Development Plan

Based on your availability: **Wed & Thu = 2–3 hrs**, **Fri & Sat = 6–8 hrs**, **Sun & Mon = assumed 2–3 hrs each** (since Sunday's a regular workday for you too — adjust if that's off). Total budget ≈ 24 hrs.

### Day 1 — Wed (2–3 hrs): Foundation
- Finalize schema decisions above (lock unit fields, confirm single vs multi-property).
- Add Prisma models, run migration, generate client.
- Scaffold module folders: `tenants/`, `units/`, `agreements/`, `payments/`, `media/` (routes/controllers/services per module, matching your existing bootstrap structure).
- Wire up base routers into the existing Express app.

### Day 2 — Thu (2–3 hrs): Tenants module
- `TenantProfile` CRUD + `zod` validation.
- NID masking logic for list/detail responses based on role.
- Basic search endpoint (name/mobile/NID).
- Seed script with a few sample tenants for testing later steps.

### Day 3 — Fri (6–8 hrs): Units + Media
- `Unit` CRUD, type-specific validation (occupancy limit required for `ROOM`, ignored for `SHOP`; dimensions required for both).
- Unit list filtering by type/status.
- Media upload endpoint (multer → local/S3), generic attach-by-owner logic.
- Attach media to units (photos) end-to-end tested via Postman/Thunder Client.

### Day 4 — Sat (6–8 hrs): Agreements + bKash payment flow (the critical path)
- `RentalAgreement` creation (DRAFT → unit RESERVED), update, list, detail.
- bKash initiate endpoint reusing your existing integration, tagged to a `Payment` record (`INITIATED`).
- bKash callback handler: verify → `$transaction` to mark payment `COMPLETED`, agreement `ACTIVE`, unit `OCCUPIED`.
- Manual/cash payment recording endpoint.
- Write 2–3 focused tests around the transaction (payment success → agreement active → unit occupied; payment failure → nothing changes).

### Day 5 — Sun (2–3 hrs): Edge cases
- Agreement termination endpoint (unit → VACANT).
- Agreement expiry handling (simple endpoint now; cron/scheduled job is a stretch goal).
- Occupancy-limit enforcement test (can't exceed limit if you're modeling multiple tenants per room — clarify if rooms are single-tenant or shared).
- Payment webhook idempotency check (duplicate callback for same `bkashTransactionId` should no-op, not double-activate).

### Day 6 — Mon (2–3 hrs): Integration pass + docs
- Full end-to-end run: create tenant → create unit → create agreement → pay via bKash sandbox → confirm unit occupied.
- Fix whatever breaks (budget most of this slot for bugs, not new features).
- Export a Postman/Insomnia collection or quick OpenAPI notes for the endpoints above so the client/frontend dev has something to work against.
- Note down anything cut for time (e.g., encryption-at-rest for NID, scheduled expiry job, RBAC granularity) as a "Phase 2" list rather than trying to squeeze it in.

**Biggest risk to your timeline:** the bKash callback + atomic status transition (Day 4). If that slips, protect it by trimming Day 5's edge cases first — a working payment→occupancy flow matters more by deadline than termination/expiry polish.