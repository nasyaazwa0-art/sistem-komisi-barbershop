# Sistem Informasi Akuntansi Pembagian Komisi Kapster pada Usaha Barbershop Berbasis Web

## 🚀 Live Demo

**[👉 Buka Web App](https://nasyaazwa0-art.github.io/sistem-komisi-barbershop/)**

> Website demo dapat langsung diakses melalui GitHub Pages.

---

## 📋 Deskripsi

**Sistem Informasi Akuntansi Pembagian Komisi Kapster** merupakan aplikasi berbasis web yang dirancang untuk membantu usaha barbershop dalam mengelola data kapster, layanan, transaksi, serta perhitungan dan pelaporan komisi kapster secara otomatis.

Aplikasi ini mengintegrasikan proses pencatatan transaksi dengan pengolahan informasi komisi sehingga data transaksi dapat menghasilkan informasi yang terstruktur untuk mendukung pengelolaan operasional usaha dan pembagian komisi kapster.

---

## 🎯 Tujuan Sistem

Sistem ini dibuat untuk:

* Mengelola data kapster.
* Mengelola data layanan dan tarif komisi.
* Mencatat transaksi layanan barbershop.
* Menghitung komisi kapster secara otomatis.
* Menyediakan riwayat transaksi.
* Menyajikan laporan komisi berdasarkan periode.
* Menampilkan ringkasan informasi melalui dashboard.

---

## ✨ Fitur Utama

### 📊 Dashboard

Menampilkan ringkasan informasi sistem, meliputi:

* Jumlah transaksi.
* Total penjualan.
* Total komisi.
* Ringkasan komisi kapster pada periode berjalan.

### 👤 Master Data Kapster

Digunakan untuk mengelola data kapster:

* Menambah kapster.
* Melihat data kapster.
* Mengubah data kapster.
* Mengelola status kapster.

### ✂️ Master Data Layanan

Digunakan untuk mengelola:

* Nama layanan.
* Harga layanan.
* Persentase komisi.
* Status layanan.

### 🧾 Transaksi

Digunakan untuk mencatat transaksi barbershop dengan:

* Nomor transaksi otomatis.
* Tanggal transaksi.
* Nama pelanggan.
* Metode pembayaran.
* Layanan yang digunakan.
* Kapster yang menangani layanan.
* Quantity.
* Subtotal.
* Nilai komisi.

### 💰 Perhitungan Komisi Otomatis

Sistem menghitung komisi berdasarkan rumus:

**Komisi = Subtotal × Persentase Komisi**

Contoh:

```text
Harga layanan    = Rp30.000
Persentase       = 40%

Komisi
= Rp30.000 × 40%
= Rp12.000
```

### 🕘 Riwayat Transaksi

Menyediakan informasi transaksi yang telah tersimpan dan dapat:

* Dicari berdasarkan nomor transaksi atau nama pelanggan.
* Difilter berdasarkan tanggal.
* Dilihat detail transaksinya.

### 📈 Laporan Komisi

Menampilkan:

* Jumlah transaksi.
* Total penjualan.
* Total komisi.
* Rekap komisi setiap kapster.
* Rincian transaksi yang membentuk nilai komisi.

---

## 🏗️ Arsitektur Sistem

```text
                         WEB APPLICATION
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
            HTML              CSS           JavaScript
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                            Supabase
                               │
                               ▼
                        PostgreSQL Database
```

---

## 🗄️ Struktur Database

Database menggunakan **PostgreSQL melalui Supabase**.

### Tabel Utama

```text
KAPSTER
│
├── id
├── nama
├── no_telepon
├── status
└── created_at


LAYANAN
│
├── id
├── nama_layanan
├── harga
├── persentase_komisi
├── status
└── created_at


TRANSAKSI
│
├── id
├── nomor_transaksi
├── tanggal
├── nama_pelanggan
├── metode_pembayaran
├── total
└── created_at


DETAIL_TRANSAKSI
│
├── id
├── transaksi_id
├── layanan_id
├── kapster_id
├── qty
├── harga_satuan
├── persentase_komisi
├── subtotal
├── nilai_komisi
└── created_at
```

### Relasi

```text
KAPSTER
   │
   └──────────────┐
                  │
                  ▼
          DETAIL_TRANSAKSI
                  ▲
                  │
   ┌──────────────┘
   │
LAYANAN

TRANSAKSI
   │
   └──────────────► DETAIL_TRANSAKSI
```

---

## 🔄 Alur Sistem

```text
Master Kapster
       │
       ▼
Master Layanan
       │
       ▼
Input Transaksi
       │
       ▼
Detail Transaksi
       │
       ▼
Perhitungan Subtotal
       │
       ▼
Perhitungan Komisi
       │
       ├──────────────► Dashboard
       │
       ├──────────────► Riwayat Transaksi
       │
       └──────────────► Laporan Komisi
```

---

## 💡 Contoh Perhitungan

Misalkan terdapat transaksi:

```text
Layanan     : Haircut
Kapster     : Andi
Harga       : Rp30.000
Qty         : 1
Komisi      : 40%
```

Maka:

```text
Subtotal
= Rp30.000 × 1
= Rp30.000

Nilai Komisi
= Rp30.000 × 40%
= Rp12.000
```

Apabila dalam satu transaksi terdapat dua layanan:

```text
Haircut
Rp30.000
Komisi Rp12.000

Shaving
Rp20.000
Komisi Rp6.000
```

Maka:

```text
Total Penjualan
= Rp50.000

Total Komisi
= Rp18.000
```

---

## 🛠️ Teknologi yang Digunakan

| Teknologi    | Fungsi                         |
| ------------ | ------------------------------ |
| HTML5        | Struktur halaman web           |
| CSS3         | Tampilan dan responsive layout |
| JavaScript   | Logika dan interaksi aplikasi  |
| Supabase     | Backend dan koneksi database   |
| PostgreSQL   | Database relasional            |
| Git          | Version control                |
| GitHub       | Repository dan source code     |
| GitHub Pages | Deployment website             |

---

## 📁 Struktur Project

```text
sistem-komisi-barbershop/
│
├── .gitignore
├── README.md
│
├── index.html
├── kapster.html
├── layanan.html
├── transaksi.html
├── riwayat.html
├── laporan.html
│
├── css/
│   └── style.css
│
└── js/
    ├── app.js
    ├── dashboard.js
    ├── kapster.js
    ├── layanan.js
    ├── transaksi.js
    ├── riwayat.js
    ├── laporan.js
    └── supabase.js
```

---

## 🔌 Integrasi Sistem

Aplikasi terhubung dengan Supabase menggunakan JavaScript.

```text
Browser
   │
   ▼
JavaScript
   │
   ▼
Supabase API
   │
   ▼
PostgreSQL
```

Data yang dimasukkan melalui aplikasi disimpan pada database Supabase dan digunakan kembali untuk dashboard, riwayat transaksi, serta laporan komisi.

---

## 🚀 Menjalankan Project Secara Lokal

### 1. Clone repository

```bash
git clone https://github.com/nasyaazwa0-art/sistem-komisi-barbershop.git
```

### 2. Masuk ke folder project

```bash
cd sistem-komisi-barbershop
```

### 3. Buka project menggunakan Visual Studio Code

```bash
code .
```

### 4. Jalankan project

Project dapat dijalankan menggunakan **Live Server** pada Visual Studio Code.

---

## 🌐 Deployment

Project ini dipublikasikan menggunakan **GitHub Pages**.

### Live Demo

**https://nasyaazwa0-art.github.io/sistem-komisi-barbershop/**

### Repository

**https://github.com/nasyaazwa0-art/sistem-komisi-barbershop**

---

## 📌 Catatan

Aplikasi ini dibuat sebagai project pengembangan **Sistem Informasi Akuntansi** dengan fokus pada proses pencatatan transaksi dan pembagian komisi kapster pada usaha barbershop.

Struktur sistem dapat dikembangkan lebih lanjut sesuai kebutuhan operasional usaha, seperti pengelolaan periode pembayaran komisi, pencetakan laporan, pengembangan hak akses pengguna, dan fitur administrasi lainnya.

---

## 👩‍💻 Developer

**Nasya Azwa Syafika**

Project Sistem Informasi Akuntansi
**Pembagian Komisi Kapster pada Usaha Barbershop Berbasis Web**