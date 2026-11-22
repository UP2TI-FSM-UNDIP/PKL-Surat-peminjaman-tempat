# Deployment Peminjaman Ruang

## 1. Topologi

- Produksi lama: `/home/pinjam/booking-mainrepo`, port 20081/20082.
- Staging baru: `/home/pinjam/peminjaman-ruang-staging/current`, port 20083/20084.
- Gateway: `apps-fsm.undip.ac.id` (10.169.0.58) → VM 10.137.58.142.
- Database: PostgreSQL 16; staging memakai `peminjaman_ruang_staging`.

## 2. Prasyarat

- PHP 8.3.6, ekstensi `pdo_pgsql`, `pdo_sqlite`, `mbstring`, `gd`, `zip`, `intl`.
- Composer user-local di `~/bin/composer`.
- Node 24 untuk build frontend.
- SSO client staging dan aturan proxy gateway.

## 3. Environment matrix

| Variabel | Staging | Produksi |
|---|---|---|
| `APP_ENV` | `staging` | `production` |
| `APP_DEBUG` | `false` | `false` |
| `APP_URL` | `https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging` | `https://apps-fsm.undip.ac.id/peminjaman-ruang-api` |
| `FRONTEND_URL` | `https://apps-fsm.undip.ac.id` | `https://apps-fsm.undip.ac.id` |
| `FRONTEND_APP_URL` | `https://apps-fsm.undip.ac.id/peminjaman-ruang-staging` | `https://apps-fsm.undip.ac.id/peminjaman-ruang` |
| `DB_CONNECTION` | `pgsql` | `pgsql` |
| `DB_DATABASE` | `peminjaman_ruang_staging` | `peminjaman_ruang_production` |
| `FILESYSTEM_DISK` | `local` | `s3`/`local` sesuai keputusan |
| `PRIVATE_FILESYSTEM_DRIVER` | `local` | `s3`/`local` sesuai keputusan |
| `SESSION_COOKIE` | `peminjaman_ruang_staging_session` | `peminjaman_ruang_session` |
| `SESSION_PATH` | `/peminjaman-ruang-api-staging` | `/peminjaman-ruang-api` |
| `AUTH_LOCAL_LOGIN` | `off` | `off` |
| `AUTH_DEV_LOGIN` | `false` | `false` |

Gunakan `booking-api/.env.staging.example` sebagai titik awal staging. Jangan menyalin `booking-api/.env.example` ke staging karena file itu memakai disk `s3` dan nilai pengembangan lokal.

## 4. Release layout

```text
/home/pinjam/peminjaman-ruang-staging/
├── releases/<sha>/
├── shared/.env
├── shared/storage/
└── current -> releases/<sha>/
```

## 5. Gateway

```apache
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
ProxyPass        /peminjaman-ruang-staging/     http://10.137.58.142:20083/peminjaman-ruang-staging/
ProxyPassReverse /peminjaman-ruang-staging/     http://10.137.58.142:20083/peminjaman-ruang-staging/
ProxyPass        /peminjaman-ruang-api-staging/ http://10.137.58.142:20084/
ProxyPassReverse /peminjaman-ruang-api-staging/ http://10.137.58.142:20084/
RedirectMatch 301 ^/peminjaman-ruang-staging$     /peminjaman-ruang-staging/
RedirectMatch 301 ^/peminjaman-ruang-api-staging$ /peminjaman-ruang-api-staging/
```

## 6. Storage

```bash
mkdir -p shared/storage/app/private shared/storage/logs \
  shared/storage/framework/cache shared/storage/framework/sessions \
  shared/storage/framework/views
ln -sfn shared/storage releases/<sha>/booking-api/storage
# Hanya bila memakai public disk lokal:
php artisan storage:link
```

## 7. SSO

- Daftarkan client staging dengan callback
  `https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging/auth/sso/redirect`.
- Isi `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, dan `SSO_REDIRECT_URI` di `shared/.env`.
- Pastikan redirect mengarah ke `FRONTEND_APP_URL` staging, bukan `localhost`.

## 8. Deploy pertama

1. Buat database dan user.
2. Upload release.
3. `composer install --no-dev --optimize-autoloader`.
4. Salin `.env.staging.example` menjadi `shared/.env`; isi secret.
5. `php artisan key:generate`.
6. `php artisan app:verify-environment`.
7. `php artisan migrate --force`.
8. `php artisan db:seed --class=ProductionSeeder --force`.
9. `php artisan config:cache && php artisan route:cache && php artisan view:cache`.
10. Upload `dist/` hasil build Node 24 dan jalankan `npm ci` di release
    (dev dependency diperlukan karena frontend staging memakai `vite preview`).
11. Arahkan `current` ke release.
12. Jalankan dari `current/booking-api` dan `current/booking-web`:

    ```bash
    pm2 start "php artisan serve --host=0.0.0.0 --port=20084 --tries=1" \
      --name backend-staging --max-memory-restart 512M
    pm2 start "vite preview --port 20083 --host 0.0.0.0 --strictPort" \
      --name frontend-staging --max-memory-restart 512M
    pm2 start "php artisan schedule:work" \
      --name scheduler-staging --max-memory-restart 256M
    pm2 save
    pm2 startup
    ```

13. Tambahkan `ProxyPass` gateway.
14. Jalankan smoke test.

## 9. Deploy update

- Buat release baru, install dependency, migrate, cache, arahkan symlink, lalu `pm2 restart`.
- Simpan maksimal tiga release.

## 10. Backup dan rollback

```bash
pg_dump -Fc peminjaman_ruang_staging > staging-$(date +%F).dump
tar -czf storage-staging-$(date +%F).tgz -C shared/storage .
# rollback
ln -sfn releases/<release-sebelumnya> current
pm2 restart backend-staging frontend-staging scheduler-staging
pg_restore -d peminjaman_ruang_staging staging-YYYY-MM-DD.dump
```

Uji rollback sekali sebelum UAT.

## 11. Scheduler dan monitoring

- `scheduler-staging` menjalankan `php artisan schedule:work`.
- Cek `schedule:list`, log harian, expiry 00:05, dan completion 00:10.
- Pantau `/up`, `laravel.log` level ERROR/CRITICAL, respons 5xx, dan kegagalan upload.

## 12. Smoke test

- `GET /up` → 200.
- `GET /api/user` tanpa token → 401.
- Web root dan deep link → 200.
- SSO redirect memakai host staging.
- `qr_url` memakai `https://apps-fsm.undip.ac.id/...`.
