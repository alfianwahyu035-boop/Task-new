# TaskMate v13 — Tema Pribadi (GitHub + APK)

Versi ini dibuat dari TaskMate v12 (fitur pemisahan rak sesuai akun tetap dipertahankan).

## Fitur
- 10 tema pilihan baru terinspirasi contoh visual: Midnight Wallet, Trantor Mint, Social Coral, Moonie Aurora, Arena Neon, Gamer Pop, Melody Studio, Ink Cat, Learn Minimal, Task Navy.
- 1 tema TaskMate Original untuk kembali ke desain awal.
- Buka **Setelan > Tema aplikasi** dan tap salah satu kartu preview tema. Tema diterapkan langsung.
- Preferensi disimpan di **localStorage** dengan kunci unik berdasarkan `state.user.id` pada browser/WebView HP ini. Sama sekali TIDAK ditulis ke Supabase.
- Akun lain pada HP yang sama punya preferensi terpisah. Akun yang sama pada HP lain juga independen.
- Menghapus data aplikasi/browser atau menginstal ulang dapat mengembalikan tema ke Original.
- Tema mengganti visual (warna, kartu, komponen, gradient, tombol, navigasi); tata letak inti dan fungsi checklist, shift, impor Excel, foto, autentikasi tidak diubah.

## Update repository GitHub
1. Ekstrak ZIP PATCH, upload file dan folder ke root repository.
2. Timpa file lama sesuai struktur folder: `app.js`, `index.html`, `themes.css` (baru), `sw.js`, `scripts/prepare-web.mjs`, `package.json`, `.github/workflows/main.yml`.
3. Commit changes. Bila memakai GitHub Pages, refresh aplikasi setelah deployment.
4. Jika APK Android, buka Actions > Build APK TaskMate dan jalankan workflow terbaru; instal APK hasil build.

## Yang TIDAK berubah
- Tidak ada perubahan skema atau isi Supabase, profil, jadwal, pembagian rak, foto bukti atau anggota.
- Tidak mengunggah file Excel jadwal pribadi ke GitHub. `roster-data.js` tetap stub kosong.
- Tidak perlu membuat akun baru.

## Catatan
- Tema mengadaptasi karakter warna dan gaya dari gambar referensi, bukan salinan layout 1:1. UI tetap memakai navigasi dan fungsi TaskMate.
- Perubahan warna pada APK baru terlihat setelah APK hasil build terbaru dipasang.
- Jika halaman masih memakai tema lama, tutup/buka kembali dan refresh hard/reload bila tersedia.
