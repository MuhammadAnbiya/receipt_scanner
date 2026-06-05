# S.A.V.O.R.I - Smart Receipt Scanner

## Ringkasan Produk
S.A.V.O.RII (Smart Receipt Scanner) adalah aplikasi web yang memungkinkan pengguna untuk mengunggah gambar struk atau mengambil foto lewat kamera, kemudian mengekstrak informasi penting seperti nama barang dan harga menggunakan Gemini Flash 2.5 API. Hasil scan disimpan dan dapat dikelola melalui antarmuka CRUD sederhana.

## Fitur Utama

### 1. Upload gambar / Akses Kamera
- Pengguna dapat memilih file gambar dari perangkat atau menggunakan kamera langsung untuk mengambil foto struk.
- Dukungan format gambar umum (JPEG, PNG, dll.).
- Tampilan preview gambar sebelum diproses.

### 2. Ekstraksi Data dengan Gemini Flash 2.5
- Mengirim gambar struk ke Gemini Flash 2.5 melalui prompt yang dirancang untuk mengidentifikasi:
  - Nama barang (item)
  - Harga masing-masing barang
  - (Opsional) total belanja, tanggal, toko
- Hasil ekstraksi dikembalikan dalam format terstruktur (JSON) untuk mudah diparsing.
- Penanganan error dan fallback bila ekstraksi gagal.

### 3. UI CRUD untuk Hasil Scan
- **C (Create)**: Menambhasil hasil scan baru secara otomatis setelah pemrosesan gambar.
- **R (Read)**: Menampilkan daftar hasil scan dalam bentuk kartu atau tabel, masing-masing menampilkan nama barang, harga, dan timestamp.
- **U (Update)**: Pengguna dapat mengedit nama barang dan harga langsung pada item yang ditampilkan.
- **D (Delete)**: Pengguna dapat menghapus item scan yang tidak diperlukan.
- Operasi CRUD dilakukan pada state lokal (React state) atau bisa diperluas ke backend/API penyimpanan selanjutnya.

### 4. Tampilan dan Gaya
- Built with Next.js App Router dan React.
- Styling menggunakan Tailwind CSS untuk desain yang responsif dan modern.
- Komponen UI sederhana dan intuitif.

## Alur Pengguna
1. Buka aplikasi S.A.V.O.R.I.
2. Pilih opsi "Upload Foto" atau "Akses Kamera".
3. Pilih atau ambil gambar struk.
4. Sistem mengirim gambar ke Gemini Flash 2.5 dan menunggu hasil ekstraksi.
5. Hasil nama barang dan harga ditampilkan pada layar.
6. Pengguna dapat menambah, mengedit, atau menghapus hasil scan melalui daftar yang tersedia.
7. Semua perubahan disimpan sementara selama sesi berjalan.

## Teknologi yang Digunakan
- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Gemini Flash 2.5 (via Google Generative AI API)
- **State Management**: React useState/useContext (atau dapat diperluas ke Redux/Zustand)
- **HTTP Client**: fetch atau axios untuk berkomunikasi dengan Gemini API
- **DevTools**: ESLint untuk kualitas kode

## Catatan Implementasi
- API key Gemini disimpan dalam variabel lingkungan (`.env.local`).
- Pastikan untuk menambahkan `.env.local` ke `.gitignore`.
- Prototype ini fokus pada frontend; untuk produksi dapat ditambahkan backend atau penyimpanan seperti localStorage, IndexedDB, atau integrasi dengan basis data eksternal.
- Validasi input gambar (ukuran, tipe MIME) sebelum diproses.
- Loading state dan pesan error ditampilkan untuk memberikan umpan balik kepada pengguna.