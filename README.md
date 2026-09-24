# Unlupa Client (Frontend Web Application)

Frontend modern untuk platform **Unlupa (Hifzhun)** yang dibangun dengan **React 19**, **TypeScript**, **Vite**, dan **TailwindCSS v4**.

---

## 🛠 Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript (`typescript`)
- **Build Tool**: Vite (`vite`)
- **Styling**: TailwindCSS v4 (`tailwindcss`, `@tailwindcss/vite`)
- **Routing**: React Router v7 (`react-router`, `react-router-dom`)
- **Server State & Data Fetching**: TanStack React Query v5 (`@tanstack/react-query`)
- **Global Client State**: Zustand (`zustand`)
- **Icons**: Lucide React (`lucide-react`)
- **Animations & Interaction**: Framer Motion (`framer-motion`, `motion`)
- **Toast Notifications**: Sonner (`sonner`)

---

## 📂 Struktur Direktori

```
unlupa-client/
├── src/
│   ├── app/                # Router configuration & App Providers
│   ├── components/         # Reusable UI & Space Components
│   │   ├── classes/        # Teaching Space, Student Progress Inspection
│   │   ├── home/           # Dashboard & Beranda Space
│   │   ├── personal/       # Personal Books & Modules Space
│   │   ├── quran/          # Quran Space, Mushaf Viewer, Juz Tracker
│   │   └── ui/             # Sidebar, Header, Modals, Badges
│   ├── context/            # AppContext & Combined Providers
│   ├── features/           # Feature Modules (Auth, Al-Quran, Classroom, Dashboard)
│   │   ├── alquran/        # Quran Catalog Hooks, Services, Types
│   │   ├── auth/           # Login, Register, Auth Store
│   │   ├── classroom/      # Classroom Pages, Hooks, Services
│   │   └── dashboard/      # Admin & Teacher Management Views
│   ├── lib/                # FSRS Memory Engine, Offline Storage, Audio Service
│   ├── pages/              # Routed Page Views
│   └── types/              # Global TypeScript Definitions
├── public/                 # Static Assets, Icons, Audio
├── index.html              # HTML Shell Template
├── package.json            # Node Dependencies & Scripts
├── tailwind.config.ts      # Tailwind Styling Config
└── vite.config.ts          # Vite Bundler Config
```

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js versi `v20.x` atau `v22.x`.
- npm atau bun terpasang.

### 2. Konfigurasi Environment (`.env`)
Salin atau buat file `.env` di dalam folder `unlupa-client/`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Install Dependensi
```bash
npm install
# atau
bun install
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Aplikasi web akan dapat diakses di browser pada alamat:
👉 `http://localhost:5173`

---

## 📦 Skrip yang Tersedia

| Command | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan lokal (Vite HMR) |
| `npm run build` | Melakukan kompilasi TypeScript (`tsc -b`) dan build produksi |
| `npm run preview` | Menjalankan pratinjau hasil build produksi secara lokal |
| `npm run lint` | Menjalankan ESLint untuk mengecek kualitas kode |

---

## 🌐 Alur Penggunaan Utama

1. **Autentikasi**:
   - Santri login $\rightarrow$ diarahkan ke `/dashboard` (atau `/dashboard/alquran`).
   - Guru login $\rightarrow$ otomatis diarahkan langsung ke `/dashboard/kelas`.
2. **Ruang Al-Qur'an (`/dashboard/alquran`)**:
   - Memilih Juz 1–30, mengaktifkan halaman hafalan baru.
   - Melakukan murajaah harian (*Daily Review*) dengan penilaian 1–4 FSRS.
   - Memutar dan merekam tasmi' hafalan mandiri.
3. **Ruang Kelas Guru (`/dashboard/kelas`)**:
   - Membuat kelas baru dan membagikan kode 6 digit ke santri.
   - Klik santri untuk masuk ke mode inspeksi (*Teacher Report / Progress View*) dalam mode *read-only*.
