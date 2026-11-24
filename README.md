# FS-01: Multi-Vendor E-Commerce Marketplace

An Amazon-style multi-vendor e-commerce platform supporting Customer, Vendor, and Admin roles, Redis cart caching, product search/filtering, automated split payments (90% vendor / 10% platform commission), order lifecycle tracking, and PDF invoice generation.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons
- **Backend & Database**: Node.js API Routes, MongoDB (Mongoose)
- **Caching & Auth**: Redis (`ioredis` with in-memory fallback), JWT & Role-Based Access Control (RBAC)
- **Payments & Documents**: Stripe Split-Payment Simulation, PDFKit

## Setup & Run
```bash
cd FS-01
npm install
npm run dev