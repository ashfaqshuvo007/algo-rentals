# Algodevs Rental Management System

Backend API for a rental property management platform. The service manages users, owners, tenants, properties, rental units, agreements, and payments through a TypeScript and Express application.

- [API Docs](https://documenter.getpostman.com/view/7324207/2sBYAxNoWK)

## Features

- Credential and Google authentication
- JWT access and refresh tokens delivered through cookies
- Role-based authorization for Super Admins, Admins, Owners, and Tenants
- Email verification and password recovery flows
- Property and unit management
- Tenant profile image and NID uploads
- PostgreSQL persistence through Prisma ORM
- Redis integration for application support
- Cloudinary integration for uploaded media
- SMTP email delivery
- bKash payment integration
- Development seed data for administrative, owner, and tenant accounts

## Technology Stack

- Node.js and TypeScript
- Express 5
- PostgreSQL
- Prisma 7
- Redis
- JSON Web Tokens
- Zod
- Nodemailer
- Cloudinary
- bKash

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL database
- Redis instance
- SMTP account
- Cloudinary account for image uploads
- Google OAuth credentials for Google login
- bKash credentials when using payment features

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. The application reads configuration from this file during startup.

```env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public

BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=replace-with-a-long-random-value
JWT_REFRESH_SECRET=replace-with-a-different-long-random-value
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id

SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=super-admin@example.com
SUPER_ADMIN_PASSWORD=change-me
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me

TEST_TENANT_NAME=Test Tenant
TEST_TENANT_EMAIL=tenant@example.com
TEST_TENANT_PASSWORD=change-me
TEST_TENANT_NID=tenant-nid
TEST_TENANT_ADDRESS=Tenant address
TEST_OWNER_NAME=Test Owner
TEST_OWNER_EMAIL=owner@example.com
TEST_OWNER_PASSWORD=change-me

REDIS_USER=default
REDIS_PASSWORD=your-redis-password
REDIS_HOST=localhost
REDIS_PORT=6379

SMTP_HOST=smtp.example.com
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_PORT=587
EMAIL_SENDER=no-reply@example.com

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

BKASH_BASE_URL=https://sandbox.bka.sh
BKASH_USERNAME=your-bkash-username
BKASH_PASSWORD=your-bkash-password
BKASH_APP_KEY=your-bkash-app-key
BKASH_APP_SECRET=your-bkash-app-secret
BKASH_CALLBACK_URL=http://localhost:5000/api/v1
```

Use real values for the services enabled in your environment. Do not commit `.env` or any credentials to source control.

### 3. Apply database migrations

```bash
npx prisma migrate deploy
```

For local schema development, create and apply a migration with:

```bash
npx prisma migrate dev --name describe-your-change
```

The Prisma schema is composed from files in `prisma/schema/`, and migrations are stored in `prisma/migrations/`.

### 4. Start the API

Development mode watches the source files and seeds the configured test accounts on startup:

```bash
npm run dev
```

The API is available at `http://localhost:5000` when `PORT=5000`.

### Seeded Test Data

On startup, the server creates the configured Super Admin, Admin, Owner, and Tenant records when they do not already exist. It also creates the following reusable rental fixtures for `TEST_OWNER_EMAIL`:

- Property: `Algo Test Residence`
- Unit: `A-101`, vacant room, monthly rent `5500`
- Unit: `A-102`, vacant room, monthly rent `7000`

The Postman collection contains login requests for the seeded owner and tenant. After logging in, copy the seeded record IDs into `OWNER_ID`, `TENANT_ID`, `PROPERTY_ID`, and `UNIT_ID` collection variables before running requests that require them. Agreement initiation also requires a tenant NID upload, and it starts a real bKash payment flow; it does not create a fake payment automatically.

## NPM Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run format:check` | Check formatting with Biome |
| `npm run format:fix` | Format source files with Biome |
| `npm run lint:check` | Check source files with Biome |
| `npm run lint:fix` | Apply Biome lint fixes |

## API Overview

All application endpoints are versioned under `/api/v1`.

### Authentication: `/api/v1/auth`

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/register` | Public |
| `POST` | `/login` | Public |
| `GET` | `/me` | Authenticated users |
| `POST` | `/refresh-token` | Public with refresh token |
| `POST` | `/google` | Public |
| `POST` | `/forgot-password` | Public |
| `POST` | `/reset-password` | Public |
| `POST` | `/verify-email` | Public |

Registration, password reset, and email verification use OTPs delivered through SMTP and stored in Redis for five minutes. Passwords must be 8–32 characters and include uppercase, lowercase, numeric, and special characters. Google authentication accepts an ID token and creates or links a tenant account.

### Properties: `/api/v1/property`

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/` | Admin or Super Admin |
| `GET` | `/my-properties` | Owner |
| `GET` | `/:propertyId` | Admin or Super Admin |
| `POST` | `/` | Admin, Owner, or Super Admin |
| `PATCH` | `/assign-owner` | Admin or Super Admin |

The static `/my-properties` route is declared before `/:propertyId`; otherwise Express would interpret `my-properties` as a property ID and execute the wrong authorization middleware.

### Tenant: `/api/v1/tenant`

| Method | Endpoint | Access |
| --- | --- | --- |
| `PATCH` | `/profile-image` | Any authenticated role |
| `PATCH` | `/nid` | Admin or Tenant |

### Units: `/api/v1/unit`

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/` | Admin, Owner, or Super Admin |
| `POST` | `/` | Owner or Admin |
| `PATCH` | `/:unitId` | Owner, Admin, or Super Admin |
| `GET` | `/:unitId` | Admin, Owner, or Super Admin |
| `GET` | `/:unitId/tenants` | Admin, Owner, or Super Admin |

Unit list filters are supplied as query parameters: `page`, `limit`, `status`, `occupancyLimit`, `type`, `floor`, `propertyId`, `minRent`, and `maxRent`. Numeric JSON body fields must be sent as numbers, not strings.

### Agreements: `/api/v1/agreement`

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/initiate` | Tenant, Admin, or Super Admin | Create an agreement and start the security-deposit payment |
| `GET` | `/create-agreement/payment/callback` | Public callback | Process the bKash payment result and redirect to the frontend |
| `PATCH` | `/:agreementId/finalize` | Owner | Approve and activate a paid agreement |
| `POST` | `/:agreementId/retry-payment` | Tenant, Admin, or Super Admin | Retry a pending security-deposit payment |
| `POST` | `/:agreementId/terminate/request` | Tenant | Request termination of an active agreement |
| `PATCH` | `/:agreementId/terminate` | Owner | Approve termination and release the unit |
| `PATCH` | `/:agreementId/terminate/reject` | Owner | Reject a termination request |

#### Agreement lifecycle

1. A tenant, admin, or super admin initiates an agreement with `unitId` and `startDate`. Admins and super admins must also provide `tenantId`.
2. The tenant must have a NID number and uploaded NID document, and the unit must be vacant.
3. The service creates the agreement and security-deposit payment, reserves the unit, and assigns it to the tenant.
4. bKash handles payment externally. The callback updates the payment and moves a successful agreement to `PENDING_APPROVAL`.
5. The property owner finalizes the agreement, changing it to `ACTIVE` and the unit to `OCCUPIED`.
6. The tenant may request termination. The owner can approve it, releasing the unit, or reject it.

Agreement initiation and payment retry call the real bKash gateway; they are not mock endpoints. The Postman callback request is only a template and requires a real `paymentID` from bKash.

## Authentication

Authentication accepts an access token from either:

1. The `accessToken` cookie
2. The `Authorization` header using `Bearer <token>`

The server enables CORS credentials, so browser clients must send requests with credentials when using cookie-based authentication. Authorization errors are returned when the authenticated user does not have one of the roles required by an endpoint.

The refresh-token endpoint reads the `refreshToken` cookie and returns a new access/refresh-token pair. Login and Google login return the tokens in the response body as well as setting cookies.

## Data Model

Prisma schema files are split under `prisma/schema/`:

- `User`: shared identity, role, credential/Google authentication state, verification, and account status.
- `Owner`: owner profile linked one-to-one with a user and optionally linked to one property.
- `Tenant`: tenant profile linked one-to-one with a user, optionally assigned to one unit, and linked to one agreement.
- `Property`: uniquely named rental property with an optional owner and many units.
- `Unit`: room or shop with rent, deposit, dimensions, occupancy, and vacancy status.
- `Agreement`: tenant-unit rental agreement with payment, activation, and termination state.
- `Payment`: security-deposit or rent payment with bKash identifiers, gateway response, and payment status.

Important enum values include:

- Roles: `SUPER_ADMIN`, `ADMIN`, `OWNER`, `TENANT`
- Unit types: `ROOM`, `SHOP`
- Unit statuses: `VACANT`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`
- Agreement statuses: `DRAFT`, `PENDING_PAYMENT`, `PENDING_APPROVAL`, `ACTIVE`, `TERMINATED`, `EXPIRED`
- Payment statuses: `INITIATED`, `UNPAID`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`

## Integrations

- **PostgreSQL and Prisma:** application data and migrations.
- **Redis:** OTP storage and bKash token caching.
- **Nodemailer/SMTP:** email verification, password reset, and application emails.
- **Cloudinary:** profile image and tenant NID uploads. Multer stores uploads in memory before sending them to Cloudinary.
- **Google OAuth:** verifies Google ID tokens and supports tenant account login/linking.
- **bKash:** security-deposit payment creation, token management, execution, and callback handling.

The `/test` endpoint is a bKash integration diagnostic: it requests a bKash ID token, so it requires valid bKash configuration rather than functioning as a simple health check.

## Project Structure

```text
src/
├── app/
│   ├── config/          Environment configuration
│   ├── lib/             Prisma, Redis, email, storage, and payment clients
│   ├── middleware/      Auth, validation, error, and not-found middleware
│   ├── module/          Feature modules and route handlers
│   ├── templates/       Email templates
│   └── utils/           JWT, response, async, and seed helpers
├── app.ts               Express application and route registration
└── server.ts            Database/service connections and server startup
prisma/
├── schema/              Prisma schema modules
└── migrations/          Database migration history
```

## Health Check

The root endpoint can be used to confirm that the Express application is responding:

```bash
curl http://localhost:5000/
```

## Development Notes

- `src/server.ts` connects to PostgreSQL and Redis, seeds configured test data, verifies Nodemailer, and then starts the HTTP server.
- The Postman collection is [Algo-Rental-Backend.postman_collection.json](Algo-Rental-Backend.postman_collection.json) and targets the `/api/v1` route prefix.
- Keep generated Prisma output in `src/generated/prisma/` in sync with schema changes.
- The repository currently has no automated test suite configured; `npm test` exits with an intentional placeholder failure. Use the build, format, and lint scripts as baseline checks.
- Startup does not listen until PostgreSQL, Redis, and SMTP initialization succeeds.
- Seed functions check for an existing user by role, so an existing user with the same role can prevent the configured seed email from being created.
- `GET /api/v1/unit/:unitId/tenants` currently returns an empty object from the controller rather than the tenant service result.
