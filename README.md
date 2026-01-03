# Invoice Bill Generator

A modern, professional invoice generation application built with React, Vite, and Supabase.

## Features

- 🧾 Create professional invoices with multiple templates
- 💾 Save and manage invoice history
- 🎨 Customizable branding settings
- 📊 Tax calculations (IGST, CGST+SGST, Standard)
- 💰 Multiple currency support (INR, USD, EUR)
- 📱 Responsive design
- 🔐 User authentication and subscription management
- 📄 PDF export functionality
- 👨‍💼 Admin dashboard for user management

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8080`

## Database Setup

1. **Run the main database setup:**

   - Copy contents of `database-setup.sql`
   - Paste in Supabase SQL Editor
   - Click "Run"

2. **Fix admin policies (if needed):**
   - Copy contents of `fix-recursion.sql`
   - Paste in Supabase SQL Editor
   - Click "Run"

## Admin Access

**Admin Email**: `nssoftwaresolutions1@gmail.com`  
**Password**: `Sikku2731#`

## Test User

**Email**: `testuser@demo.com`  
**Password**: `TestUser123!`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **Frontend:** React 18, Vite, TailwindCSS
- **UI Components:** Radix UI, Lucide React
- **Backend:** Supabase (Database, Auth)
- **PDF Generation:** jsPDF, html2canvas
- **State Management:** React Query
- **Routing:** React Router DOM
