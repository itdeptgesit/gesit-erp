# GESIT WORK - Enterprise Work Platform

![GESIT WORK Logo](/public/image/logo.png)

**GESIT WORK** is a robust, enterprise-grade Internal Work Platform designed to centralize and streamline IT operations, asset management, procurement, and helpdesk services. Built with modern web technologies, it offers a secure, responsive, and intuitive interface for managing organizational resources.

---

## 🚀 Table of Contents

- [Key Features](#-key-features)
  - [Asset Management](#-asset-management)
  - [Helpdesk System](#-helpdesk-system)
  - [Procurement & Finance](#-procurement--finance)
  - [Network Infrastructure](#-network-infrastructure)
  - [Administration & Security](#-administration--security)
- [Technical Architecture](#-technical-architecture)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Key Features

### 📦 Asset Management
Complete lifecycle management for IT and organizational assets.
- **Inventory Tracking:** Log hardware details (Specs, Serial Numbers, Purchase Date).
- **Life Cycle Status:** Track assets from *New* -> *Active* -> *Broken* -> *Disposed*.
- **Asset Loans:** Managed workflow for temporary asset lending to employees.
- **QR Code Integration:** Generate QRs for instant mobile access to asset details.
- **Public View:** External-facing pages for verifying asset ownership and status.

### 🎫 Advanced Helpdesk System
A centralized ticketing and communication hub for enterprise support.
- **Internal Notes:** Private communication channel for IT Staff to discuss technical details without visibility to the client.
- **Real-time Progress:** Live file upload tracking with circular progress indicators for attachments.
- **Ticket Archive:** Full history pagination for users to browse and manage their historical support records.
- **Feedback Loop:** Built-in rating and feedback system for clients to evaluate IT support quality.
- **Operational Metrics:** Automatic tracking of resolution timestamps (`resolved_at`) and performance analytical data.
- **Responsive Chat:** Modern, real-time message interface with emoji support and media previews.

### 💰 Procurement & Finance
Streamlined purchasing workflows.
- **Purchase Planning:** Submit and approve budget plans for upcoming quarters.
- **Purchase Records:** Detailed logging of transactions, vendors, and costs.
- **Approval Workflows:** Multi-stage approval (Supervisor -> Manager -> Finance).
- **Document Management:** Attach invoices, receipts, and delivery notes.

### 🌐 Network Infrastructure
Visual tools for network administrators.
- **Topology Diagrams:** Interactive visualization of network nodes and links.
- **Switch Management:** Manage port status, VLANs, and connected devices.
- **Wiring Schedules:** Document structured cabling and patch panel connections.

### 🛡️ Administration & Security
- **Modern Login Experience:** Completely overhauled, responsive login interface with universal language for better user experience.
- **RBAC (Role-Based Access Control):** Granular permissions for Admins, Staff, and Users.
- **Audit Logging:** Comprehensive trails of all user actions for compliance.
- **Dynamic Theming:** Dark/Light mode support and customizable branding (Logo, Colors, Fonts).

---

## 🏗️ Technical Architecture

### Frontend
- **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **State Management:** React Hooks & Context API
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend & Media
- **Database/Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Media Uploads:** [Cloudinary](https://cloudinary.com/) (Used for Helpdesk attachments with progress tracking)
- **Deployment:** [Vercel](https://vercel.com/)
- **Language Support:** Multi-language translation engine integrated.

---

## 🏗️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/gesit-work.git
    cd gesit-work
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
    VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

---

## ⚙️ Configuration

### System Settings
The application allows dynamic configuration without redeployment via the **System Settings** module (Admin only).
- **Branding:** Change App Name, Logo, Favicon.
- **Appearance:** Set Primary Color, Font Family (Inter, Roboto, etc.).

### Database Migrations
SQL migrations are stored in the root directory. To apply migrations (including the new `is_internal` field):
1.  Go to Supabase Dashboard -> SQL Editor.
2.  Apply the relevant `.sql` files to maintain schema parity.

---

## 📄 License

Proprietary Software. Internal Use Only.
Copyright © 2026 GESIT WORK. All rights reserved.