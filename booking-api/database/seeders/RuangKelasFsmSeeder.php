<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

/**
 * Daftar ruang kelas FSM (sumber: Ruang_Kelas_FSM.xlsx, export 2026-08-24).
 *
 * - Hanya baris unik (58 ruang); baris duplikat di sumber diabaikan.
 * - Kode ruang di aplikasi = nama ruang (A101, B204, ...), karena kode SIAKAD
 *   di sumber tidak unik (mis. A301/A302 sama-sama 2401030204). Kode SIAKAD
 *   tetap dicatat di deskripsi.
 * - Kapasitas = kapasitas kuliah; 0 di sumber disimpan kosong.
 * - Nomor HP penanggung jawab sengaja tidak disimpan (deskripsi dapat dilihat
 *   semua pengguna); hanya nama penanggung jawab.
 *
 * Aman dijalankan ulang (upsert berdasarkan kode). Status ruang yang sudah ada
 * tidak diubah.
 *
 * Jalankan: php artisan db:seed --class=RuangKelasFsmSeeder
 */
class RuangKelasFsmSeeder extends Seeder
{
    public function run(): void
    {
        // [kode, keterangan, kode SIAKAD, luas m2, kapasitas kuliah, kapasitas ujian, prodi, penanggung jawab]
        $rooms = [
            ['A101', '', '2401010104', 77.00, 70, 70, 'Fisika S1', 'Parmadi (Ateng)'],
            ['A102', '', '2401010204', 77.00, 70, 70, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A103', '', '2401010304', 77.00, 70, 70, null, 'Parmadi (Ateng)'],
            ['A104', '', '2401010404', 84.00, 80, 80, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A105', '', '2401014004', 84.00, 80, 80, null, 'Parmadi (Ateng)'],
            ['A201', '', '2401020104', 77.00, 70, 70, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A202', '', '2401020204', 77.00, 70, 70, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A203', '', '2401020304', 77.00, 70, 70, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A204', '', '2401020404', 77.00, 70, 70, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A205', '', '2401020504', 99.00, 90, 90, 'Fisika S1', 'Parmadi (Ateng)'],
            ['A301', '', '2401030204', 70.00, 55, 50, 'Informatika S1', 'Parmadi (Ateng)'],
            ['A302', '', '2401030204', 70.00, 55, 50, null, 'Parmadi (Ateng)'],
            ['A303', '', '2401030304', 91.30, 55, 50, null, 'Parmadi (Ateng)'],
            ['A304', '', '2401030504', 91.30, 55, 50, null, 'Parmadi (Ateng)'],
            ['A305', '', '2401030304', 77.00, 80, 80, 'Matematika S1', 'Parmadi (Ateng)'],
            ['A306', '', '2401030404', 99.00, 90, 90, 'Kimia S1', 'Parmadi (Ateng)'],
            ['B101', '', '2402010104', 77.00, 64, 64, 'Matematika S1', 'Khoirul Mustofa'],
            ['B102', '', '2402010204', 77.00, 70, 70, 'Matematika S1', 'Khoirul Mustofa'],
            ['B103', '', '2402010304', 77.00, 70, 70, 'Matematika S1', 'Khoirul Mustofa'],
            ['B104', '', '2402010304', 51.00, 50, 50, null, 'Khoirul Mustofa'],
            ['B105', '', '2402010404', 60.00, 42, 42, null, 'Khoirul Mustofa'],
            ['B106', '', '2402010505', 51.00, 50, 50, null, 'Khoirul Mustofa'],
            ['B201', '', '2402020104', 77.00, 64, 64, 'Matematika S1', 'Khoirul Mustofa'],
            ['B202', '', '2402020204', 77.00, 70, 70, 'Matematika S1', 'Khoirul Mustofa'],
            ['B203', '', '2402020304', 77.00, 70, 70, 'Matematika S1', 'Khoirul Mustofa'],
            ['B204', '', '2402020404', 77.00, 70, 70, 'Biologi S1', 'Khoirul Mustofa'],
            ['B205', '', '2402020504', 37.00, 50, 50, null, 'Khoirul Mustofa'],
            ['B206', '', '2402020604', 37.00, 50, 50, null, 'Khoirul Mustofa'],
            ['C203', '', '2403020304', 50.00, 55, 55, null, 'BELUM ADA PJ'],
            ['E101', '', '2405010104', 205.00, 140, 140, 'Matematika S1', 'M. Jamal'],
            ['E303', '', '24050330304', null, 25, 25, null, 'M. Jamal'],
            ['F104', 'R. Rapat Departemen Matematika Lantai 1', '2406010407', 10.00, 10, 0, null, 'Andi Wintoro'],
            ['F107', 'R. Sidang Departemen Matematika', '2406010707', 10.00, 30, 0, null, 'Andi Wintoro'],
            ['F202', 'R. Rapat Departemen Matematika', '2406020207', 10.00, 10, 0, null, 'Andi Wintoro'],
            ['G102', '', '2407010203', 40.00, null, 0, null, 'Bagas Adi'],
            ['G201', '', '2407020104', 34.80, 30, 30, null, 'Bagas Adi'],
            ['G202', '', '2407020204', 34.80, 30, 30, null, 'Bagas Adi'],
            ['G203', '', '2407020304', 40.00, 30, 30, null, 'Bagas Adi'],
            ['G204', '', '2407020404', 34.00, 50, 50, null, 'Bagas Adi'],
            ['G205', '', '2407020507', 23.00, 15, 15, null, 'Bagas Adi'],
            ['G211', '', '2407021104', 40.00, 8, 8, null, 'Bagas Adi'],
            ['G304', '', '2408030404', 91.30, 50, 50, 'Kimia S1', 'Bagas Adi'],
            ['G306', '', '2408030608', 91.30, 50, 50, 'Informatika S1', 'Bagas Adi'],
            ['I209', '', '2409020907', 40.00, 8, 8, null, 'Maulana'],
            ['I202', '', '2409020205', 10.00, 10, 10, null, 'Maulana'],
            ['I204', '', '2409020404', 40.00, 8, 8, null, 'Maulana'],
            ['I302', '', '2409030205', 20.00, 15, 15, null, 'Maulana'],
            ['I304', '', '2409030404', 40.00, 8, 8, null, 'Maulana'],
            ['K101', '', '2411010104', 90.00, 50, 50, null, 'Aris'],
            ['K102', '', '2411010204', 90.00, 50, 50, null, 'Aris'],
            ['K103', '', '2411010304', 37.00, 25, 20, null, 'Aris'],
            ['K104', '', '2411010404', 37.00, 25, 20, null, 'Aris'],
            ['K105', '', '2411010504', 25.00, 20, 15, null, 'Aris'],
            ['K202', '', '2411020204', 66.00, 50, 50, null, 'Aris'],
            ['K203', 'Lab Geotermal 2', '2411020304', 25.00, 20, 0, null, 'Aris'],
            ['K301', '', '2411030104', 66.00, 50, 50, null, 'Aris'],
            ['K302', '', '2411030204', 63.00, 50, 50, null, 'Aris'],
            ['K303', '', '2411030305', 66.00, 50, 50, null, 'Aris'],
        ];

        $created = 0;
        $updated = 0;

        foreach ($rooms as [$code, $label, $siakad, $area, $capacity, $examCapacity, $prodi, $pic]) {
            $building = substr($code, 0, 1);
            $name = $label !== '' ? "Ruang {$code} - {$label}" : "Ruang {$code}";

            $details = ["Gedung {$building}"];
            if ($area) {
                $details[] = 'Luas ' . rtrim(rtrim(number_format($area, 2, ',', ''), '0'), ',') . ' m²';
            }
            if ($examCapacity) {
                $details[] = "Kapasitas ujian {$examCapacity} orang";
            }
            if ($prodi) {
                $details[] = "Prodi pengguna: {$prodi}";
            }
            $details[] = $pic && $pic !== 'BELUM ADA PJ'
                ? "Penanggung jawab: {$pic}"
                : 'Penanggung jawab: belum ada (status sebagai ruang kelas belum terkonfirmasi)';
            $details[] = "Kode SIAKAD {$siakad}";

            $room = Room::withTrashed()->firstOrNew(['code' => $code]);
            $isNew = !$room->exists;

            $room->fill([
                'name' => $name,
                'capacity' => $capacity,
                'description' => implode(' · ', $details),
            ]);
            if ($isNew) {
                $room->facilities = [];
                $room->status = 'ACTIVE';
            }
            $room->save();

            $isNew ? $created++ : $updated++;
        }

        $this->command?->info("Ruang kelas FSM: {$created} ditambahkan, {$updated} diperbarui (total " . count($rooms) . ').');
    }
}
