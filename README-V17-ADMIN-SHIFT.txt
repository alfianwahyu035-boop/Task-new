TaskMate v17 — Admin Shift & PIC per Tugas

Fitur:
- 1 Admin Shift per tanggal dan shift, dipilih oleh Admin Tim dari anggota aktif yang terjadwal.
- Admin Shift atau Admin Tim dapat menentukan satu PIC untuk setiap tugas operasional di shift tersebut.
- PIC dipilih dari daftar nama Excel yang terjadwal untuk tanggal/shift tersebut.
- Pada akun karyawan, yang tampil adalah tugas miliknya + Sisir Harga dan Map Do It yang memang wajib per petugas.
- Sisir Harga hanya berisi rak sesuai akun yang login dan ditautkan, bukan rak orang lain.
- Admin Shift dapat melihat seluruh tugas untuk pengawasan.
- Penugasan pada tanggal tertentu tidak otomatis mengubah tanggal lain.
- Server (Supabase RLS) menolak percobaan ceklis dan upload bukti tugas yang bukan milik PIC.
- Jika tugas sudah memiliki foto/ceklis, pemindahan PIC diblokir untuk menjaga audit.
- Karyawan belum login/ditautkan boleh dipilih berdasarkan Excel, tetapi belum dapat menerima tugas di HP sampai akunnya disetujui, ditautkan dan tersinkron ke roster.

Cara mengatur:
1. Login Admin Tim, masuk menu Shift dan pilih tanggal & Shift 1/2/3.
2. Di panel 'Admin Shift & Pembagian PIC', pilih Admin Shift yang aktif dan terjadwal.
3. Admin Shift membuka panel yang sama dan memilih PIC per tugas.
4. Karyawan me-refresh TaskMate untuk melihat tugas masing-masing. Perubahan didistribusikan Realtime saat tersambung.
5. Sisir Harga tetap tampil untuk semua akun yang terjadwal; Map Do It tetap kewajiban foto per petugas seperti versi sebelumnya.

Penting:
- Rully dan Citra hanya bisa dipilih pada shift ketika mereka terjadwal. Jika Rully bekerja Shift 2, Admin Shift 1 tidak bisa menugaskannya di Shift 1 tanpa menyesuaikan jadwal terlebih dahulu.
- Penugasan tidak otomatis memilih Admin Shift atau PIC untuk data historis/lama.
- Jangan upload dokumen Excel berisi data pribadi ke GitHub Public.
- Backend v17 sudah dipasang pada Supabase TASKMATE-REMINDER. Jangan jalankan SQL ulang kecuali untuk pemulihan migrasi.

Cara upload ke GitHub:
- PATCH: timpa app.js, themes.css, index.html, sw.js. File petunjuk ini opsional.
- FULL: ekstrak zip; upload isi direktori ZIP ke root repository, bukan folder pembungkus. Pastikan .github ikut.
- Jika memakai APK, jalankan ulang workflow GitHub Actions kemudian instal APK terbaru.
- Jika memakai PWA, reload dan tutup/buka aplikasi jika cache lama tertahan.
