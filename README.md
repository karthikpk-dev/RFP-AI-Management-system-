# 🚀 AI-Powered RFP Management System

An intelligent Request for Proposal (RFP) management system that leverages Google Gemini AI to streamline procurement workflows, from creating structured RFPs to parsing vendor proposals and recommending the best vendor.

## 📋 Deliverables

- ✅ **Full-stack application** with React frontend and Node.js/Express backend
- ✅ **AI-powered RFP generation** from natural language using Gemini
- ✅ **Automated proposal parsing** via email (IMAP) with AI extraction
- ✅ **Intelligent vendor comparison** with scoring and recommendations
- ✅ **PostgreSQL database** with Sequelize ORM and migrations

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Vite + Tailwind CSS | Fast development, modern tooling, utility-first CSS for rapid UI |
| **Backend** | Node.js + Express | JavaScript consistency, excellent async I/O for email handling |
| **Database** | PostgreSQL + Sequelize | Robust JSONB support for structured RFP data, reliable ORM |
| **AI** | Google Gemini (gemini-1.5-flash) | Free tier available, fast responses, good at structured extraction |
| **Email** | Nodemailer (SMTP) + imap-simple (IMAP) | Industry standard, works with Ethereal for testing |
| **Monorepo** | npm workspaces | Simple single-repo management for client/server |

---

## ⚡ Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Google Gemini API key ([Get one free](https://makersuite.google.com/app/apikey))

### 1. Install Dependencies

```bash
git clone <repo-url>
cd aerchain
npm install
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/rfp_management

# Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_api_key_here

# For testing: Create account at https://ethereal.email
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_ethereal_user
EMAIL_PASS=your_ethereal_pass
IMAP_HOST=imap.ethereal.email
IMAP_PORT=993
```

### 3. Setup Database

```bash
# Create database
createdb rfp_management

# Run migrations
npm run db:migrate --workspace=server

# (Optional) Seed dummy vendors
npm run seed --workspace=server
```

### 4. Start Development

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## 📡 API Endpoints

### RFPs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfps` | List all RFPs |
| POST | `/api/rfps` | Create new RFP |
| GET | `/api/rfps/:id` | Get RFP details |
| POST | `/api/rfps/generate` | AI generate structured RFP from query |
| POST | `/api/rfps/:id/send` | Email RFP to vendors |
| GET | `/api/rfps/:id/compare` | AI compare proposals |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List all vendors |
| POST | `/api/vendors` | Create vendor |
| PUT | `/api/vendors/:id` | Update vendor |
| DELETE | `/api/vendors/:id` | Delete vendor |

### Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposals` | List proposals (filter: `?rfpId=`) |
| POST | `/api/proposals/refresh` | Fetch & parse new emails from IMAP |
| PUT | `/api/proposals/:id/score` | Update proposal score |

---

## 🤖 AI Features

### 1. RFP Generation
**Prompt Strategy**: Convert natural language to structured JSON with title, lineItems, budget, deliveryDate, paymentTerms.

```
Input: "I need 100 laptops with 16GB RAM for $150,000"
Output: { title: "Laptop Procurement", lineItems: [...], budget: 150000 }
```

### 2. Proposal Parsing
**Prompt Strategy**: Extract total_price, line_item_prices, warranty_terms, delivery_time from vendor email body.

### 3. Proposal Comparison
**Prompt Strategy**: Score proposals 0-100, identify strengths/weaknesses, recommend best vendor with explanation.

---

## 📝 Decisions & Assumptions

### Architecture Decisions

1. **Monorepo with npm workspaces** - Simpler deployment vs separate repos
2. **Sequelize over Prisma** - More mature, better raw SQL support
3. **JSONB for structured data** - Flexible schema for varying RFP formats
4. **gemini-1.5-flash model** - Best balance of free tier limits and speed

### Email Assumptions

1. **Vendors reply to the same thread** - Subject line contains RFP ID for matching
2. **RFP ID format**: `RFP #<uuid>` in email subject
3. **Vendor matching by email address** - Sender email must match vendor record
4. **Ethereal for testing** - Production would use real SMTP/IMAP

### Workflow Assumptions

1. **Single user system** - No authentication (as per requirements)
2. **Manual proposal refresh** - User triggers email fetch vs polling
3. **Scores stored after comparison** - Persisted to database for future reference

---

## 📁 Project Structure

```
aerchain/
├── package.json              # Root workspaces config
├── README.md
├── client/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Layout, shared UI
│   │   ├── pages/            # Dashboard, CreateRfp, Vendors, RfpDetail
│   │   └── services/         # API client
│   └── ...
└── server/                   # Express + Sequelize
    ├── src/
    │   ├── config/           # Database config
    │   ├── models/           # Rfp, Vendor, Proposal
    │   ├── routes/           # API route handlers
    │   ├── services/         # AI, Email send/receive
    │   └── migrations/       # Database migrations
    └── ...
```

---

## 🎬 Demo Flow

1. **Create RFP**: Type natural language requirements → AI structures → Save
2. **Add Vendors**: Add vendor name/email via Vendors page
3. **Send RFP**: Open RFP → Select vendors → Send via email
4. **Receive Proposals**: Vendors reply via email → Click "Refresh Proposals"
5. **Compare**: Click "AI Compare" → View scores and recommendation

---

## 📄 License

MIT
