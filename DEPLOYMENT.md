# Deployment Peminjaman Ruang

## 1. Topologi

- Produksi lama: `/home/pinjam/booking-mainrepo`, port 20081/20082.
- Staging baru: `/home/pinjam/peminjaman-ruang-staging/current`, port 20083/20084.
- Gateway: `apps-fsm.undip.ac.id` (10.169.0.58) → VM 10.137.58.142.
- Database: PostgreSQL 16; staging memakai `peminjaman_ruang_staging`.

## 2. Prasyarat

- PHP 8.3.6, ekstensi `pdo_pgsql`, `pdo_sqlite`, `mbstring`, `gd`, `zip`, dan `intl` bila diminta `composer check-platform-reqs`.
- Composer user-local di `~/bin/composer.phar`.
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
| `LOG_LEVEL` | `warning` | `warning` |
| `LOG_STACK` | `single` | `single` |

Gunakan `booking-api/.env.staging.example` sebagai titik awal staging. Jangan menyalin `booking-api/.env.example` ke staging karena file itu memakai disk `s3` dan nilai pengembangan lokal. Set `LOG_LEVEL=warning` dan `LOG_STACK=single` agar log staging tidak menyimpan payload SSO berisi data pribadi.

## 4. Release layout

```text
/home/pinjam/peminjaman-ruang-staging/
├── releases/<sha>/
├── shared/.env
├── shared/storage/
├── shared/ecosystem.staging.config.cjs
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
rm -rf /home/pinjam/peminjaman-ruang-staging/releases/<sha>/booking-api/storage
ln -s /home/pinjam/peminjaman-ruang-staging/shared/storage \
  /home/pinjam/peminjaman-ruang-staging/releases/<sha>/booking-api/storage
ln -sfn /home/pinjam/peminjaman-ruang-staging/shared/.env \
  /home/pinjam/peminjaman-ruang-staging/releases/<sha>/booking-api/.env
# Hanya bila memakai public disk lokal:
php artisan storage:link
```

Gunakan path absolut. `booking-api/storage` sudah ada sebagai direktori nyata dari repo,
jadi direktori itu harus dihapus sebelum symlink dibuat. Symlink relatif akan menunjuk
ke dalam release, bukan ke `shared/storage`.

## 7. SSO

- Daftarkan client staging dengan callback
  `https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging/auth/sso`.
- Isi `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, dan `SSO_REDIRECT_URI` di `shared/.env`.
- Pastikan redirect mengarah ke `FRONTEND_APP_URL` staging, bukan `localhost`.
- Untuk uji staging, client production boleh dipakai dengan `SSO_REDIRECT_URI` staging.
- Jika portal SSO menolak redirect staging, ajukan client staging; jangan mengubah client production.
- Frontend memakai `client_id` + `redirect_uri`; backend menerima token di `/auth/sso` dan mengembalikan `/redirect`.

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
12. Jalankan proses dari satu definisi
    `shared/ecosystem.staging.config.cjs` (lihat §4):

    ```bash
    pm2 delete backend-staging frontend-staging scheduler-staging 2>/dev/null || true
    pm2 start /home/pinjam/peminjaman-ruang-staging/shared/ecosystem.staging.config.cjs
    pm2 save
    systemctl is-enabled pm2-pinjam
    ```

    `pm2 startup` tidak perlu diulang bila `pm2-pinjam.service` sudah enabled.

    Ecosystem menetapkan `cwd`, `VITE_BASE_PATH`, dan port 20083/20084. Jangan memakai
    `vite preview` tanpa `cwd` dan `VITE_BASE_PATH`.

13. Tambahkan `ProxyPass` gateway.
14. Jalankan smoke test.

## 9. Deploy update

- Buat release baru, install dependency, migrate, cache, arahkan symlink `current`, lalu
  jalankan ulang proses dari ecosystem (bukan `pm2 restart <file.cjs>`; PM2 6 menganggap
  argumen itu nama proses):

  ```bash
  pm2 delete backend-staging frontend-staging scheduler-staging 2>/dev/null || true
  pm2 start /home/pinjam/peminjaman-ruang-staging/shared/ecosystem.staging.config.cjs
  pm2 save
  ```

- Simpan maksimal tiga release.

## 10. Backup dan rollback

```bash
pg_dump -Fc peminjaman_ruang_staging > staging-$(date +%F).dump
tar -czf storage-staging-$(date +%F).tgz -C shared/storage .
# rollback
ln -sfn /home/pinjam/peminjaman-ruang-staging/releases/<release-sebelumnya> current
pm2 delete backend-staging frontend-staging scheduler-staging 2>/dev/null || true
pm2 start /home/pinjam/peminjaman-ruang-staging/shared/ecosystem.staging.config.cjs
pm2 save
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
- `qr_url` dan `receipt_url` memakai prefix
  `https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging/`.
