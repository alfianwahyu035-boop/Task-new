TaskMate v15 — Perbaikan Shapes & Navbar (10 November 2026)

MASALAH DI V14: kartu folder 3D hanya terlihat pada tema Pop Folder, sementara tema Midnight Wallet tetap terlihat biasa. Navbar menyorot seluruh tab sehingga ikon tertutup kotak warna yang terlalu besar.

DIPERBAIKI V15:
* Pilihan Bentuk kartu di Setelan: Folder 3D atau Kartu halus.
* Folder 3D otomatis aktif pada semua tema selain Original (termasuk Midnight Wallet).
* Semua kartu ringkasan dan shift bergaya folder: tab warna, border tegas, hard shadow.
* Navbar 6 menu mengikuti tema, HANYA ikon terpilih diberi kotak aksen; label tetap terlihat.
* Perubahan tema & bentuk tetap pribadi pada akun/perangkat, tanpa perubahan Supabase.
* Link stylesheet dan JavaScript ditambah ?v=15.1 untuk menghindari cache lama.

PENEMPATAN FILE PATCH: upload file di root sesuai struktur foldernya. Untuk GitHub Pages, gunakan app.js, themes.css, index.html, sw.js. File www/ tidak perlu ditimpa di root, sudah disertakan jika pengguna memakai workflow khusus.

Tidak ada SQL dan data Supabase yang perlu diubah.
Untuk APK jalankan workflow GitHub Actions agar APK baru dibuat; update GitHub tidak otomatis mengubah APK terpasang.
