# Booking System - Document Workflow Management

Complete document booking and workflow management system with multi-step approval process.

## 🚀 Features

### Backend (Laravel 11 API)

- **Authentication** - Sanctum-based JWT authentication
- **User Management** - Complete CRUD with role-based access control
- **Role Management** - Custom roles with slug-based permissions
- **Unit Management** - Hierarchical organizational units (7 categories)
- **Workflow Engine** - Dynamic multi-step approval workflows
- **Reservation Management** - Create, review, and approve room reservations
- **Access Control** - Role and unit-based reservation visibility

### Frontend (React + TypeScript)

- **Admin Panel** - Comprehensive admin dashboard
- **Users Management** - Full CRUD with role/unit assignment
- **Roles Management** - Role creation with auto-slug generation
- **Units Management** - Hierarchical unit structure with categories
- **Workflows Management** - Create workflows with multi-step configuration
- **Real-time Updates** - TanStack Query for optimistic updates
- **Type Safety** - Full TypeScript coverage

## 📁 Project Structure

```
peminjaman-tempat/
├── booking-api/          # Laravel 11 Backend API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── DocumentController.php
│   │   │   ├── WorkflowController.php
│   │   │   ├── UserController.php
│   │   │   ├── RoleController.php
│   │   │   └── UnitController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Role.php
│   │   │   ├── Unit.php
│   │   │   ├── Document.php
│   │   │   ├── Workflow.php
│   │   │   └── WorkflowStep.php
│   │   └── Services/
│   │       └── WorkflowEngine.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
└── booking-web/          # React Frontend
    ├── src/
    │   ├── components/
    │   │   └── admin/
    │   │       ├── UsersManagement.tsx
    │   │       ├── RolesManagement.tsx
    │   │       ├── UnitsManagement.tsx
    │   │       └── WorkflowsManagement.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── userService.ts
    │   │   ├── roleService.ts
    │   │   ├── unitService.ts
    │   │   └── workflowService.ts
    │   └── routes/
    │       └── admin.tsx
    └── package.json
```

## 🛠️ Tech Stack

### Backend

- Laravel 11
- PHP 8.2+
- Sanctum (Authentication)
- PostgreSQL/MySQL
- RESTful API

### Frontend

- React 18
- TypeScript
- Vite
- TanStack Router (Type-safe routing)
- TanStack Query (Server state)
- Axios (HTTP client)
- shadcn/ui (UI components)
- Tailwind CSS

## 🚦 Quick Start

### Run API and Web Together

After dependencies are installed, one command from the repo root starts both the Laravel API and the Vite dev server:

```bash
npm run dev
# or
./dev.sh
```

- API: `http://127.0.0.1:8000`
- Web: `http://localhost:20081/peminjaman-ruang/`
- Ctrl-C stops both processes.

Requirements and overrides:

- MySQL/MariaDB configured in `booking-api/.env` must be running. The script only checks the port and prints a warning when it is unreachable.
- `VITE_API_URL` in `booking-web/.env` must point to the API port (`http://localhost:8000/api` by default).
- Change ports with `API_PORT=8001 WEB_PORT=20082 ./dev.sh`.
- Local email/password login is disabled by default (`AUTH_LOCAL_LOGIN=off` in `booking-api/.env`, `VITE_LOCAL_LOGIN=false` in `booking-web/.env`). Set them to `all` and `true` to test without SSO.

The backend needs both frontend variables in `booking-api/.env` (they serve different purposes):

```
# SSO redirect target, may include a path
FRONTEND_APP_URL=http://localhost:20081/peminjaman-ruang
# CORS and Sanctum origins only, comma separated
FRONTEND_URL=http://localhost:20081,http://127.0.0.1:20081
```

The per-component steps below remain valid when you only want to run one side.

### Dev Login (local only)

For local development the frontend can log in without SSO and switch roles from the top bar. Enable it in `booking-api/.env`:

```
AUTH_DEV_LOGIN=true
```

Then restart the API. `npm run dev` shows a "Ganti akun" button in the top bar and logs in automatically as the default Admin.

- Default account: `admin@fsm.undip.ac.id` (role Admin).
- The switch dialog lists one seeded account per role: Admin, Wakil Dekan 2, Manajer Tata Usaha, Supervisor Sumberdaya, Mahasiswa, and Dosen.
- Only requests from `127.0.0.1`/`::1` are accepted. `APP_ENV=production` always returns 404, even when the flag is on.
- Logout disables auto-login for the current tab so the SSO flow can be tested. The "Masuk sebagai Admin" button on the landing page re-enables it.
- Run `php artisan db:seed` first so the six accounts exist.
- Never enable `AUTH_DEV_LOGIN` on staging or production.

Built previews (`npm run preview`) hide the menu unless `VITE_DEV_LOGIN=true`.

### Backend Setup

1. Navigate to API folder:

```bash
cd booking-api
```

2. Install dependencies:

```bash
composer install
```

3. Setup environment:

```bash
copy .env.example .env
php artisan key:generate
```

4. Configure database in `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=booking_db
DB_USERNAME=root
DB_PASSWORD=
```

5. Run migrations and seeders:

Lokal (akun demo):

```bash
cd booking-api
php artisan migrate:fresh --seed
```

Staging/produksi (tanpa akun demo):

```bash
cd booking-api
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder --force
php artisan app:assign-role --email=admin@fsm.undip.ac.id --role=admin
```

6. Start development server:

```bash
php artisan serve
```

API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to web folder:

```bash
cd booking-web
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment:

```bash
copy .env.example .env
```

Configure `.env`:

```
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:

```bash
npm run dev
```

App will be available at `http://localhost:20081/peminjaman-ruang/`

## 🔑 Default Credentials

After seeding the database:

| Role                 | Email                        | Password |
| -------------------- | ---------------------------- | -------- |
| Admin                | admin@fsm.undip.ac.id        | password |
| Wakil Dekan II       | wadek2@fsm.undip.ac.id       | password |
| Manajer Tata Usaha   | tu@fsm.undip.ac.id           | password |
| Supervisor Sumberdaya| spv@fsm.undip.ac.id          | password |
| Mahasiswa            | mahasiswa@student.undip.ac.id| password |
| Dosen                | dosen@undip.ac.id            | password |

⚠️ **Change these passwords in production!**

## 📚 API Endpoints

### Authentication

```
POST   /api/login
POST   /api/logout
GET    /api/user
```

### Users

```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Roles

```
GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PUT    /api/roles/:id
DELETE /api/roles/:id
```

### Units

```
GET    /api/units
POST   /api/units
GET    /api/units/:id
PUT    /api/units/:id
DELETE /api/units/:id
```

### Workflows

```
GET    /api/workflows
POST   /api/workflows
GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id
POST   /api/workflows/:id/steps
PUT    /api/workflows/:id/steps/:stepId
DELETE /api/workflows/:id/steps/:stepId
```

### Documents

```
GET    /api/documents
GET    /api/documents/:id
POST   /api/documents/:id/submit
POST   /api/documents/:id/approve
POST   /api/documents/:id/reject
POST   /api/documents/:id/revise
GET    /api/documents/:id/file/proposal
```

## 🎯 Key Features Explained

### 1. Document Visibility System

**Three Document Categories:**

- `my_documents` - Documents created by user
- `pending_documents` - Documents awaiting the user's approval
- `processed_documents` - Documents the user has already reviewed

**Admin Override:**

- Admin users see ALL documents in `all_documents` category
- Useful for system-wide monitoring and auditing

### 2. Document Access Control

Users can view a document if they are:

- The creator of the document
- Current holder (awaiting their approval)
- Have processed the document (approved, rejected, or returned it)
- Admin role

### 3. Workflow Engine

**Dynamic Routing:**

- Satu workflow `UMUM` untuk seluruh reservasi
- Steps configured with target roles
- Approver dicari di unit fakultas

**Example Workflow:**

1. Supervisor Sumberdaya memverifikasi
2. Manajer Tata Usaha menyetujui
3. Wakil Dekan II menyetujui

### 4. Unit Hierarchy

**7 Unit Categories:**

- FAKULTAS (Faculty)
- JURUSAN (Department)
- PRODI (Study Program)
- HIMA (Student Association)
- SENAT (Senate)
- BEM (Student Executive Board)
- UKM (Student Activity Unit)

**Hierarchical Structure:**

```
Fakultas Teknik
├── Teknik Informatika (JURUSAN)
│   ├── S1 Teknik Informatika (PRODI)
│   └── HIMA IF (HIMA)
└── Sistem Informasi (JURUSAN)
    └── HIMA SI (HIMA)
```

### 5. Step Management

**Add Step:**

```bash
POST /api/workflows/:id/steps
{
  "step_order": 3,
  "step_name": "Final Review",
  "target_role_slug": "admin",
  "scope_type": "SELF"
}
```

**Update Step:**

```bash
PUT /api/workflows/:id/steps/:stepId
{
  "step_name": "Updated Name"
}
```

**Delete Step:**

```bash
DELETE /api/workflows/:id/steps/:stepId
```

## 🧪 Testing

### Backend Testing

Run all tests:

```bash
cd booking-api
php artisan test
```

### Frontend E2E Testing

E2E memakai Playwright (Chromium) dan menjalankan empat alur smoke: login dev admin, daftar ruang, daftar peminjaman, dan halaman peminjam.

```bash
cd booking-web
npx playwright install chromium
npm run test:e2e
npm run test:e2e:report
```

Playwright menyalakan API di `127.0.0.1:18000` dan Vite di `127.0.0.1:20181`, lalu memakai database SQLite khusus `booking-api/database/e2e.sqlite`. Database MySQL lokal tidak disentuh. Dev login hanya aktif di lingkungan lokal dan loopback; jangan mengaktifkan `AUTH_DEV_LOGIN` di produksi.

### CI

GitHub Actions menjalankan tiga job pada PR ke `main`:

- `backend` — `php artisan test` dengan PHP 8.4 dan SQLite.
- `web` — `npm run lint` dan `npm run build`.
- `e2e` — Playwright Chromium setelah `backend` dan `web` hijau.

Aktifkan branch protection untuk `main` dan jadikan `backend`, `web`, serta `e2e` sebagai required status checks. Ini dilakukan manual di GitHub Settings, bukan dari repository.

`vendor/bin/pint --test` belum dijadikan gate karena repo belum format-clean; reformasi format dilakukan di PR terpisah.

### API Testing with Postman

1. Import collection: `booking-api/Booking-API.postman_collection.json`
2. Set environment variable `base_url` to `http://localhost:8000/api`
3. Run "Login" request to get token
4. Token auto-saves for subsequent requests

### Manual Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide.

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

### Quick Deploy Checklist

Backend:

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database
- [ ] Run `composer install --optimize-autoloader --no-dev`
- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan db:seed`
- [ ] Run `php artisan config:cache`
- [ ] Set proper file permissions

Frontend:

- [ ] Update `VITE_API_URL` to production API
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder to web server
- [ ] Configure web server for SPA routing

## 🐛 Common Issues

### CORS Errors

**Solution:** Update `SANCTUM_STATEFUL_DOMAINS` in backend `.env` to include frontend domain.

### 401 Unauthorized

**Solution:** Check token is being sent in Authorization header. Verify token hasn't expired.

### Token Not Persisting

**Solution:** Check browser localStorage. Ensure token is saved after successful login.

### Documents Not Showing

**Solution:**

- Verify user has correct role and unit assignments
- Check document workflow matches user's unit category
- Ensure user is in workflow step's target role

## 📖 Documentation

- [Frontend README](booking-web/README.md) - Frontend architecture and setup
- [Backend API Documentation](booking-api/README.md) - API endpoints and models
- [Testing Guide](TESTING.md) - Comprehensive testing procedures
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Support

For support and questions:

- Create an issue in the repository
- Contact the development team

## 🎉 Acknowledgments

- Laravel framework for robust backend
- React ecosystem for modern frontend
- shadcn/ui for beautiful components
- TanStack for excellent state management tools

---

**Built with ❤️ for efficient document workflow management**
