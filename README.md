# Algodevs Rental Management System

Backend API for a rental property management platform. The service manages users, owners, tenants, properties, rental units, agreements, and payments through a TypeScript and Express application.

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
BKASH_CALLBACK_URL=http://localhost:5000/api/v1/payment/callback
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
| `POST` | `/` | Owner or Super Admin |
| `PUT` | `/` | Owner or Super Admin |
| `GET` | `/:unitId` | Admin, Owner, or Super Admin |
| `GET` | `/:unitId/tenants` | Admin, Owner, or Super Admin |

## Authentication

Authentication accepts an access token from either:

1. The `accessToken` cookie
2. The `Authorization` header using `Bearer <token>`

The server enables CORS credentials, so browser clients must send requests with credentials when using cookie-based authentication. Authorization errors are returned when the authenticated user does not have one of the roles required by an endpoint.

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
- Keep generated Prisma output in `src/generated/prisma/` in sync with schema changes.
- The repository currently has no automated test suite configured; use the build, format, and lint scripts as baseline checks.
