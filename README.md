# LifeHub - All-in-One Personal Productivity Web App

Aplikasi web personal berbasis **HTML, CSS (Tailwind CSS CDN), dan JavaScript murni (Vanilla JS)** yang menggabungkan tiga fitur utama:
1. 💰 **Pengelola Keuangan Pribadi**: Catat pemasukan, pengeluaran, saldo bersih, riwayat transaksi, serta grafik visual distribusi pengeluaran.
2. ✅ **Pengelola Tugas (To-Do List)**: Atur tugas, tingkat prioritas (Tinggi, Sedang, Rendah), tenggat waktu, progress bar persentase selesai, dan filter status.
3. 📝 **Buku Catatan (Notes Hub)**: Tulis ide, rangkuman, pilih warna kartu catatan, filter kategori, dan pencarian cepat berbasis teks.

---

## 🚀 Cara Menjalankan

Aplikasi ini bersifat **portabel dan tidak memerlukan server atau instalasi Node.js**:
1. Buka file [`index.html`](file:///C:/Users/habie/.gemini/antigravity/scratch/productivity-hub/index.html) langsung dengan mengklik dua kali di file explorer, atau klik kanan lalu pilih **Open with Google Chrome / Microsoft Edge / browser favoritmu**.
2. Aplikasi langsung siap digunakan!

---

## 📁 Struktur File

- [`index.html`](file:///C:/Users/habie/.gemini/antigravity/scratch/productivity-hub/index.html): Halaman antarmuka lengkap dengan layout modern responsif (desktop & smartphone).
- [`app.js`](file:///C:/Users/habie/.gemini/antigravity/scratch/productivity-hub/app.js): Logika aplikasi, state management dengan `localStorage`, Chart.js, kalkulasi saldo, dan fitur ekspor/impor JSON.

---

## ✨ Fitur Unggulan

- **Offline & Aman**: Semua data tersimpan di `localStorage` peramban web kamu, data tidak dikirim ke server luar.
- **Ekspor & Impor (Backup)**: Ada tombol ekspor ke file `.json` untuk mem-backup data atau memindahkannya ke komputer lain.
- **Dashboard Ringkas**: Langsung menyajikan ringkasan saldo kas, daftar tugas paling mendesak, serta catatan terbaru dalam satu pandangan.
