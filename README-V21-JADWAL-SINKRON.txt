TASKMATE V21 — MANAJEMEN JADWAL + SINKRON HP ↔ SUPABASE

APA YANG BARU
1. Admin Tim dapat edit satu tanggal jadwal Excel, pilih Shift 1 (P7), Shift 2 (S14), Shift 3 (M22), libur O, AO, MT, atau cuti C.
2. Admin dapat hapus tanggal tertentu, atau rentang hingga 62 hari.
3. Jadwal privat hasil impor dan roster online diperbarui dalam satu transaksi di Supabase.
4. Tugas, foto dan riwayat yang sudah punya bukti dilindungi. Perubahan jadwal lama tidak diizinkan.
5. Tombol ↻ Sinkron di header dan halaman Shift, juga Setelan. Sync menarik data dari Cloud, tidak menimpa data Cloud dengan cache HP.
6. Update otomatis ketika koneksi online kembali, setelah membuka lagi aplikasi, serta lewat Realtime (termasuk shift_staff_seed).
7. Pilihan tema tetap lokal per akun/HP; tidak disimpan ke Cloud.

CARA PAKAI
Admin Tim -> Shift -> Jadwal dari Excel -> Kelola jadwal impor.
Pilih nama karyawan, tanggal, dan kode baru. Klik Simpan, atau Hapus tanggal ini.
Untuk beberapa tanggal: buka Hapus beberapa tanggal sekaligus.
Setelah perubahan, karyawan bisa tekan ↻ Sinkron di header agar segera menarik data Cloud.

CARA UPDATE GITHUB
Gunakan ZIP PATCH, ekstrak lalu upload file app.js, themes.css, index.html, sw.js ke root repository dengan menimpa file versi lama. Commit.
Kalau APK dipasang di HP, build ulang di GitHub Actions dan pasang APK baru.
Kalau browser/PWA masih menampilkan versi lama, refresh/force stop aplikasi untuk memperbarui cache.

CATATAN
Server SQL v21 sudah terpasang di Supabase TASKMATE-REMINDER. Tak perlu menjalankan SQL sendiri.
Hanya Admin Tim yang bisa edit/hapus jadwal. Tidak ada perubahan data sebenarnya sewaktu pengujian.
Data yang sudah mempunyai foto/checklist, termasuk penugasan Admin Shift dan PIC aktif, terlindungi dari penghapusan yang menyebabkan inkonsistensi.
Tidak ada sinkronisasi offline write queue; ketika internet tidak ada, perubahan jadwal harus menunggu koneksi kembali.
