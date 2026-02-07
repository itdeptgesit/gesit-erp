# GESIT WORK 🚀

**Modern Enterprise Work Platform - Streamline Your Operations**

GESIT WORK is a comprehensive enterprise resource planning (ERP) system designed for modern businesses. Built with cutting-edge technologies, it provides a seamless experience for managing assets, infrastructure, helpdesk operations, and more.

![Version](https://img.shields.io/badge/version-4.1.2-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

---

## ✨ Features

### � Core Modules

#### � **Dashboard**
- Real-time business metrics and KPIs
- Interactive data visualizations with Recharts
- Smart greetings and contextual insights
- Quick access to all modules

#### 🌐 **Infrastructure Documentation V3.0**
- **Interactive Network Topology**: Visual network mapping with drag-and-drop
- **Smart Path Tracing**: Automatic route highlighting from devices to core
- **IPAM Integration**: IP address and MAC tracking
- **VLAN Visualization**: Color-coded network segmentation
- **Search & Filter**: Intelligent node highlighting and dimming
- **Export Capabilities**: PNG/JPEG topology exports

#### 📦 **Asset & Inventory Management**
- Complete asset lifecycle tracking
- QR code generation for asset identification
- Asset loan/borrow workflow
- Maintenance scheduling and history
- Custom categorization and tagging
- Advanced search and filtering

#### 🎫 **Helpdesk & Service Desk**
- Public ticket submission portal
- Real-time ticket notifications
- Admin dashboard for ticket management
- Live chat integration
- SLA tracking and reporting
- Ticket categorization and prioritization

#### ⚙️ **System Settings**
- **Modern Tab Interface**: Organized settings across General, Appearance, Security, and System tabs
- **17 Font Options**: Choose from popular fonts including Inter, Roboto, Poppins, Google Sans, Ubuntu, and more
- **Theme Customization**: 5 color presets + custom color picker
- **Security Policies**: Session timeout, login attempts, password requirements
- **Data Management**: Audit log export and cache management
- **Organization Settings**: Branding, contact info, and company details

#### 👥 **User Management**
- Role-based access control (Admin, User, Guest)
- User activity logging and audit trails
- Profile management
- Permission management

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS 4.1 + Custom CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router DOM 7

### Backend & Services
- **BaaS**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Authentication**: Supabase Auth with RLS
- **Database**: PostgreSQL with Row Level Security

### Utilities
- **QR Codes**: qrcode library
- **Image Export**: html-to-image
- **Excel Export**: xlsx
- **Emojis**: Lobehub Fluent Emoji

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **npm** or **yarn**
- **Supabase Account**: For backend services

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

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Run the SQL migration files in your Supabase SQL editor:
   - `update_system_settings.sql`
   - `update_activity_logs.sql`
   - `update_it_assets.sql`
   - `add_font_to_settings.sql`
   - `add_more_settings_columns.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## � Project Structure

```
gesit-erp/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── SystemSettings.tsx
│   ├── AssetManagement.tsx
│   ├── InfrastructureDoc.tsx
│   └── ...
├── lib/                # Utility libraries
│   ├── supabaseClient.ts
│   └── auditLogger.ts
├── public/             # Static assets
│   └── image/
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── translations.ts     # i18n translations
├── index.css          # Global styles
├── App.tsx            # Main application component
└── index.tsx          # Application entry point
```

---

## 🎨 Customization

### Fonts
The application supports 17 Google Fonts:
- Inter, Roboto, Poppins, Lato, Montserrat
- Open Sans, Nunito, Work Sans, Raleway
- Source Sans Pro, Outfit, Plus Jakarta Sans
- DM Sans, Space Grotesk, Manrope
- Ubuntu, Google Sans

Change fonts in **System Settings → Appearance → Typography**

### Theme Colors
Choose from 5 preset colors or use the custom color picker:
- Default Blue (#2563eb)
- Royal Indigo (#4f46e5)
- Rose Red (#e11d48)
- Emerald Green (#059669)
- Violet Purple (#7c3aed)

Customize in **System Settings → Appearance → Theme Color**

---

## 📈 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

The project includes a `vercel.json` configuration for optimized deployment.

### Other Platforms
The application can be deployed to any static hosting service:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages

---

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- Role-based access control
- Session timeout management
- Password strength requirements
- Audit logging for all critical actions
- Secure authentication with Supabase Auth

---

## 📊 Database Schema

Key tables:
- `user_accounts` - User profiles and authentication
- `system_settings` - Global application settings
- `it_assets` - Asset inventory
- `infrastructure_devices` - Network devices
- `helpdesk_tickets` - Support tickets
- `user_activity_logs` - Audit trail

---

## 🤝 Contributing

This is a proprietary project for internal use. For feature requests or bug reports, please contact the IT Department.

---

## 📝 License

**Proprietary / Internal Use Only**

© 2024-2026 IT DEPT GESIT. All rights reserved.

---

## 👨‍💻 Development Team

**IT Department GESIT**
- Enterprise Solutions Development
- Infrastructure Management
- System Administration

---

## 📞 Support

For technical support or questions:
- **Email**: Check System Settings for configured support email
- **Phone**: Check System Settings for configured support phone
- **Helpdesk**: Use the built-in ticketing system

---

## 🎯 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] API documentation
- [ ] Multi-language support expansion
- [ ] Dark mode enhancements
- [ ] Offline mode support

---

**Built with ❤️ by IT DEPT GESIT**