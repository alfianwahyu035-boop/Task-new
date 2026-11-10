TASKMATE V22 — TUGAS PRIBADI BERDASARKAN PIC

PERBAIKAN
- Default pada seluruh akun termasuk Admin Tim dan Admin Shift adalah Tugas Saya.
- Tugas yang sudah dipilih PIC hanya muncul di akun yang tertaut ke PIC tersebut dan terjadwal pada shift/tanggal itu.
- Sisir Harga muncul di semua akun, dengan daftar rak hanya rak akun sendiri.
- Map Do It muncul untuk petugas yang dijadwalkan; setiap akun hanya mengisi foto miliknya.
- Admin Tim / Admin Shift punya tombol Pantau Semua untuk melihat semua tugas; tugas milik PIC lain hanya dapat dipantau dan tidak bisa dicentang dari layar admin.
- Pengaturan Admin Shift dan PIC tidak dihapus. Penugasan dan foto lama tidak berubah.
- Tombol Sinkron masih mengambil jadwal dan PIC terbaru dari Supabase.

CARA UPLOAD PATCH
Ekstrak patch, lalu upload app.js, themes.css, index.html, sw.js ke root repository GitHub dan timpa file lama.
Jika menggunakan APK, jalankan workflow GitHub untuk build ulang.
Setelah memasang, tekan Sinkronkan Sekarang.

INFO
Jika PIC karyawan belum punya akun tertaut dan jadwal online, tugas tidak ditampilkan pada akun karyawan lain. Admin bisa melihatnya lewat Pantau Semua.
