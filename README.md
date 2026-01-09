# Gesit ERP 🚀
**Professional-grade Enterprise Resource Planning with Advanced Infrastructure Management.**

Gesit ERP is a modern, high-performance web application designed for streamlined business operations, asset tracking, and professional network documentation. Built with a focus on speed, aesthetics, and real-time data integration.

---

## 🌟 Key Modules

### 🖥️ Main Dashboard
- **Interactive Insights**: Real-time visualization of core metrics.
- **Dynamic UX**: Smart greetings and date integration based on user context.
- **Modular Navigation**: One-click access to all critical business functional areas.

### 🌐 Infrastructure Engine (Documentation V3.0)
- **Intelligent Topology**: Live network mapping with anti-overlap positioning logic.
- **Path Highlighting**: Recursive tracing of logical routes from any device to the Core Hub.
- **Search-Aware Canvas**: Focus on specific hardware by automatically dimming non-matching nodes.
- **IPAM & Hardware Tracking**: Comprehensive database for IP addresses, MAC IDs, and Link Speeds.
- **VLAN Visualization**: Color-coded link paths based on network segmentation.

### 📦 Asset & inventory Management
- **Lifecycle Tracking**: Monitor assets from procurement to disposal.
- **Loan System**: End-to-end workflow for internal asset lending.
- **QR Code Identity**: Scan-and-access documentation for every hardware unit.

### 🎫 Helpdesk & Service Desk
- **Public Reporting**: Easy-to-use interface for external/internal ticket submission.
- **Real-time Notifications**: Immediate alerts for new tickets and chat activity.
- **Admin Hub**: Optimized dashboard for engineers to resolve issues efficiently.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS (Custom UI Components) & [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage)
- **Utilities**: `html-to-image` (Topology Export), `qrcode` (Asset Labels)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn
- Supabase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/itdeptgesit/gesit-erp.git
   cd gesit-erp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 📈 Deployment
This project is optimized for [Vercel](https://vercel.com/).
- Integrated CI/CD for main branch.
- Automatic TypeScript validation and build checks.

---

## 📝 License
Proprietary / Internal Use Only - **IT DEPT GESIT**