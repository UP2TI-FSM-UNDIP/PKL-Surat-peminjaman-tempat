# Testing

## Backend

```bash
cd booking-api
php artisan test
```

Test memakai SQLite `:memory:` dari `phpunit.xml` agar cepat. Untuk memeriksa kompatibilitas PostgreSQL 16, jalankan suite yang sama dengan environment PostgreSQL:

```bash
DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5432 \
DB_DATABASE=booking_test DB_USERNAME=postgres DB_PASSWORD=postgres \
php artisan test
```

## Frontend unit

```bash
cd booking-web
npm test
```

## Lint dan build

```bash
cd booking-web
npm run lint
npm run build
```

## E2E

```bash
cd booking-web
npm run test:e2e
```

Playwright menjalankan Chromium dengan satu worker, menyalakan API di `127.0.0.1:18000`, Vite di `127.0.0.1:20181`, dan memakai `booking-api/database/e2e.sqlite`. Database lokal tidak disentuh.

## Audit

```bash
(cd booking-api && composer audit --locked --no-dev)
(cd booking-web && npm audit --omit=dev)
```

## UAT

- Skenario dan hasil ada di `docs/uat/fase-4/` (dibuat pada Plan C).
- Simpan bukti: screenshot, ID request, potongan log, status sebelum/sesudah.
- Sign-off FSM disimpan bersama hasil UAT.
