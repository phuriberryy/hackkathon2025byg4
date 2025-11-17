# CMU ShareCycle

A web application for CMU students to exchange items, promoting zero waste and building community.

## Features

- 🔐 **Authentication**: Login and registration with CMU email
- 📦 **Item Management**: Post, edit, and manage items for exchange
- 🔄 **Exchange Requests**: Create and manage exchange requests
- 💬 **Real-time Chat**: Chat with other users about exchanges
- 📱 **QR Code Confirmation**: Confirm exchanges using QR codes
- 🔔 **Notifications**: Real-time notifications for exchange requests and messages
- 📊 **Statistics Dashboard**: View overall website statistics
- 🌱 **CO₂ Tracking**: Track environmental impact of exchanges

## Tech Stack

### Frontend
- React 18
- React Router
- TailwindCSS
- Socket.io Client
- HTML5 QR Code Scanner

### Backend
- Node.js + Express
- PostgreSQL
- Socket.io
- JWT Authentication
- Nodemailer (Email service)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd hackkathon2025byg4
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/sharecycle_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Database Setup

```bash
# Create database
createdb sharecycle_db

# Run migrations
npm run db:migrate
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

## Running the Application

### Development Mode

#### Option 1: Using start scripts (Recommended)

From the root directory:

```bash
# Start both frontend and backend
./start.sh

# Or start separately
./start-backend.sh
./start-frontend.sh
```

#### Option 2: Manual start

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Project Structure

```
hackkathon2025byg4/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── db/             # Database connection
│   │   └── utils/          # Utility functions
│   └── sql/                # Database migrations
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── context/         # React context
│   │   ├── lib/             # API client
│   │   └── utils/           # Utility functions
│   └── public/              # Static files
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Items
- `GET /api/items` - List all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Exchange Requests
- `POST /api/exchange` - Create exchange request
- `GET /api/exchange/:id` - Get exchange request
- `POST /api/exchange/:id/accept-owner` - Owner accepts
- `POST /api/exchange/:id/accept-requester` - Requester accepts
- `POST /api/exchange/:id/reject` - Reject request

### Chats
- `GET /api/chats` - List user's chats
- `POST /api/chats` - Create chat
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/confirm` - Confirm QR code

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read

### Statistics
- `GET /api/statistics` - Get website statistics

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required environment variables.

## License

This project is part of a hackathon submission.

