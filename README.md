# AerChain RFP System

AerChain is an AI-powered Request for Proposal (RFP) management system designed to streamline the procurement process. It leverages Google's Gemini AI to help users generate RFPs from natural language descriptions, automatically parse vendor proposals received via email, and intelligently compare them to recommend the best vendor.

## 🚀 Project Setup

### Prerequisites
-   **Node.js** (v18+ recommended)
-   **PostgreSQL** (running locally or accessible via URL)
-   **Google Gemini API Key** (for AI features)
-   **Email Account** (Gmail recommended) with App Password enabled for IMAP/SMTP access.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd aerchain
    ```

2.  **Install Dependencies:**
    This project uses npm workspaces. You can install dependencies for both client and server from the root:
    ```bash
    npm install
    ```
    Or install individually:
    ```bash
    cd client && npm install
    cd ../server && npm install
    ```

### Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=aerchain_db
DB_HOST=127.0.0.1
DB_DIALECT=postgres

# AI Configuration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration (SMTP for Sending)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Email Configuration (IMAP for Receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

### Database Setup

1.  **Create the Database:**
    Ensure PostgreSQL is running and create the database specified in `DB_NAME`.
    ```bash
    createdb aerchain_db
    ```

2.  **Run Migrations:**
    ```bash
    cd server
    npx sequelize-cli db:migrate
    ```

3.  **Seed Initial Data (Optional):**
    Populate the database with dummy vendors.
    ```bash
    npm run seed
    ```

### Running Locally

1.  **Start the Backend Server:**
    ```bash
    cd server
    npm run dev
    ```
    The server will start on `http://localhost:3000`.

2.  **Start the Frontend Client:**
    ```bash
    cd client
    npm run dev
    ```
    The client will start on `http://localhost:5173`.

## 🛠 Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS (Custom "Slate & Violet" Premium Theme)
-   **Routing**: React Router DOM
-   **HTTP Client**: Fetch API

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM**: Sequelize
-   **Email Services**:
    -   **Sending**: `nodemailer`
    -   **Receiving**: `imap-simple`, `mailparser`
-   **AI Provider**: Google Generative AI (`@google/generative-ai`) - Gemini Models

## 📚 API Documentation

### RFPs

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rfps` | Get all RFPs | - |
| `GET` | `/api/rfps/:id` | Get single RFP details | - |
| `POST` | `/api/rfps/generate` | Generate RFP structure from text | `{ "query": "I need 50 laptops..." }` |
| `POST` | `/api/rfps` | Create a new RFP | `{ "title": "...", "structuredData": {...} }` |
| `POST` | `/api/rfps/:id/send` | Send RFP to vendors | `{ "vendorIds": [1, 2] }` |
| `GET` | `/api/rfps/:id/compare` | Compare proposals for an RFP | - |

### Vendors

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vendors` | Get all vendors | - |
| `POST` | `/api/vendors` | Add a new vendor | `{ "name": "...", "email": "..." }` |
| `DELETE` | `/api/vendors/:id` | Delete a vendor | - |

### Proposals

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/proposals` | Get proposals (filter by `?rfpId=`) | - |
| `POST` | `/api/proposals/refresh-sync` | Trigger email check for new proposals | - |

## 🧠 Decisions & Assumptions

### Key Design Decisions
1.  **Email-Centric Workflow**: Instead of forcing vendors to log into a portal, the system meets them where they are—email. Vendors reply to the RFP email, and the system parses their response.
2.  **AI-First Approach**: AI is not an add-on but central to the workflow. It handles:
    -   **Generation**: Structuring vague user requirements into concrete line items.
    -   **Ingestion**: Converting unstructured email text into structured proposal data (price, warranty, etc.).
    -   **Analysis**: Scoring and comparing proposals to provide actionable recommendations.
3.  **Polling for Updates**: To keep the architecture simple without webhooks, the client triggers a "Refresh" action which instructs the server to poll the IMAP inbox for new replies.

### Assumptions
-   **Email Format**: We assume vendors will reply directly to the RFP email, preserving the subject line (which contains the RFP ID) so the system can map the proposal to the correct RFP.
-   **AI Accuracy**: We assume the AI can reasonably interpret standard business English in emails to extract pricing and terms.
-   **Single Currency**: The system currently assumes all monetary values are in USD.

## 🤖 AI Tools Usage

This project was built with the assistance of AI tools to accelerate development and enhance functionality.

### Tools Used
-   **Google Gemini API**: The core intelligence engine for the application features.
-   **AI Coding Assistant**: Used for generating boilerplate code, debugging errors, and refining the UI design.

### How AI Helped
1.  **Boilerplate Generation**: Quickly set up the Express server structure, Sequelize models, and React component skeletons.
2.  **UI/UX Design**: The "Premium Slate & Violet" design system, including the glassmorphism effects and floating animations, was iteratively refined with AI assistance to ensure a modern look.
3.  **Complex Logic**: The logic for parsing email threads and extracting specific JSON data from unstructured text was heavily assisted by AI prompting strategies.
4.  **Debugging**: Rapidly identified and resolved issues like the Tailwind configuration loading problem and IMAP connection timeouts.

### Notable Prompts/Approaches
-   **Structured Output**: We consistently used prompts instructing the AI to "Output ONLY valid JSON" to ensure the backend could reliably parse AI responses without fragile regex.
-   **Role-Playing**: Prompts often started with "Act as a procurement expert..." to ground the AI's responses in the correct domain context.
