TaskMate v20 — Perbaikan ujung kartu Folder 3D (benar-benar tidak menonjol)

Mengapa patch v19.1 tidak berhasil? Kode lama masih memakai top:-13px
pada ::before, sehingga tab warna tetap keluar dari tepi atas kartu.

Perbaikan v20:
- Tab kartu Shift tidak lagi menonjol di luar panel.
- Aksen warna digambar di DALAM bagian atas header, bukan di atas border.
- Shadow kanan diperkecil dan diberi ruang agar tidak melewati layar HP.
- Sidebar jadwal/rak tetap bisa dibuka dan di-scroll.
- Cache SW dan versi CSS menjadi 20.0 agar pembaruan tidak tertahan cache.

Paket PATCH: upload isi ZIP ini di ROOT repository GitHub yang digunakan
untuk TaskMate (jangan upload file ZIP mentah).
Ganti: themes.css, index.html, sw.js. Tidak perlu mengubah app.js.
Pastikan file ada di root repo, commit, lalu refresh/force stop aplikasi.
Jika menggunakan APK Capacitor, build dan install ulang APK terbaru.

Cek selesai: tidak ada lagi tab warna yang melewati garis tepi atas
kartu Freshfood/Kasir/Awal Shift. Aksen warnanya sekarang ada di DALAM
tepi atas kartu.

Tidak ada perubahan tabel/data Supabase, PIC, foto, atau jadwal.
