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

### 🎫 Helpdesk System
A centralized ticketing system for IT support.
- **Ticket Management:** Create, assign, and track support requests.
- **SLA Tracking:** Monitor priority levels (*Critical, High, Medium, Low*).
- **Interactive Communication:** Comment threads between requesters and IT staff.
- **Resolution Knowledge Base:** Archive solutions for future reference.

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
- **RBAC (Role-Based Access Control):** Granular permissions for Admins, Staff, and Users.
- **Audit Logging:** Comprehensive trails of all user actions for compliance.
- **System Maintenance:** Tools for data sanitation and system resets (*Nucleus Wipe*).
- **Dynamic Theming:** Customizable branding (Logo, Colors, Fonts) via System Settings.

---

## 🏗️ Technical Architecture

### Frontend
- **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **State Management:** React Hooks & Context API
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Lucide React](https://lucide.dev/) (Icons), [Framer Motion](https://www.framer.com/motion/) (Animations)

### Backend & Data
- **Platform:** [Supabase](https://supabase.com/) (BaaS)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth (Email/Password)
- **Storage:** Supabase Storage (for Assets/Documents)
- **Security:** Row Level Security (RLS) policies acting as the authorization layer.

---

## � Installation & Setup

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
    Create a `.env` file in the root directory. You can copy the structure from `.env.example` if available.
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: The application also supports runtime environment injection via `window.process.env` in `index.html` for specific deployment scenarios.*

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
- **Security:** Configure Session Timeout, Max Login Attempts.

### Database Migrations
SQL migrations are stored in the root directory (e.g., `migration.sql`, `nucleus_wipe_migration.sql`).
To apply migrations:
1.  Go to Supabase Dashboard -> SQL Editor.
2.  Copy/Paste the content of the SQL file.
3.  Run the query.

---

## 🚀 Deployment

The project is optimized for deployment on **Vercel**.

1.  Push your code to a Git repository (GitHub/GitLab).
2.  Import the project into Vercel.
3.  Add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel Project Settings.
4.  Deploy.

*A `vercel.json` file is included to handle client-side routing rewrites.*

---

## 🤝 Contributing

1.  **Branching:** Use descriptive branch names (e.g., `feature/add-dark-mode`, `fix/login-bug`).
2.  **Commits:** Follow conventional commit messages.
3.  **Pull Requests:** Submit PRs for review before merging to `main`.

---

## 📄 License

Proprietary Software. Internal Use Only.
Copyright © 2026 GESIT WORK. All rights reserved.