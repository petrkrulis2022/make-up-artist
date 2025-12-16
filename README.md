# Glow by Hanka - Make Up Artist Website

A full-stack web application for a professional makeup artist portfolio and services website. Features a public-facing website in Czech language with an elegant aesthetic, and a secure administrative interface for content management.

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)
- [Production Deployment](#production-deployment)
- [License](#license)

## Project Structure

```
make-up-hanka/
├── backend/              # Node.js/Express backend API
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── middleware/  # Express middleware (auth, upload, error handling)
│   │   ├── migrations/  # Database migrations and seed files
│   │   ├── routes/      # API route handlers
│   │   ├── scripts/     # Utility scripts
│   │   ├── services/    # Business logic (auth, email, image)
│   │   └── server.js    # Express server entry point
│   ├── tests/           # Backend tests
│   │   └── properties/  # Property-based tests
│   ├── uploads/         # Uploaded image files (created automatically)
│   ├── package.json     # Backend dependencies
│   ├── .env.example     # Environment variables template
│   └── .gitignore       # Backend gitignore
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   │   └── admin/   # Admin-specific pages
│   │   ├── services/    # API service functions
│   │   ├── tests/       # Frontend tests
│   │   │   └── properties/  # Property-based tests
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # React entry point
│   ├── package.json     # Frontend dependencies
│   ├── vite.config.js   # Vite configuration
│   ├── .env.example     # Environment variables template
│   └── .gitignore       # Frontend gitignore
├── .kiro/
│   └── specs/           # Feature specifications and design documents
└── README.md            # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for version control)

### Verify Prerequisites

```bash
node --version    # Should be v18 or higher
npm --version     # Should be 8 or higher
psql --version    # Should be 14 or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd make-up-hanka
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Database Setup

### 1. Create PostgreSQL Databases

Create both development and test databases:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create databases
CREATE DATABASE glowbyhanka;
CREATE DATABASE glowbyhanka_test;

# Create a user (optional, if not using default postgres user)
CREATE USER glowbyhanka_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE glowbyhanka TO glowbyhanka_user;
GRANT ALL PRIVILEGES ON DATABASE glowbyhanka_test TO glowbyhanka_user;

# Exit psql
\q
```

### 2. Run Database Migrations

Navigate to the backend directory and run migrations:

```bash
cd backend
npm run migrate
```

This will create the following tables:

- `users` - Admin user accounts
- `categories` - Portfolio categories (4 predefined categories)
- `images` - Image metadata and associations

### 3. Seed Initial Data

Seed the database with initial categories and admin user:

```bash
npm run seed
```

This creates:

- Four portfolio categories: "Svatební líčení", "Líčení na plesy a večírky", "Slavnostní líčení", "Líčení pro focení"
- Default admin user (username: `admin`, password: `admin123` - **change this in production!**)

### 4. Verify Database Setup

```bash
npm run verify-db
```

This script verifies that all tables are created and initial data is present.

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/glowbyhanka
DATABASE_TEST_URL=postgresql://postgres:your_password@localhost:5432/glowbyhanka_test

# JWT Configuration
JWT_SECRET=your-secure-random-string-at-least-32-characters-long
JWT_EXPIRATION=24h

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@glowbyhanka.cz
SMTP_PASSWORD=your-email-app-password
SMTP_FROM=info@glowbyhanka.cz

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**

- Replace `your_password` with your PostgreSQL password
- Generate a strong `JWT_SECRET` (use `openssl rand -base64 32` or similar)
- For Gmail SMTP, use an [App Password](https://support.google.com/accounts/answer/185833)
- `MAX_FILE_SIZE` is in bytes (5242880 = 5MB)

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit the `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

## Running the Application

### Development Mode

You'll need two terminal windows/tabs:

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:3000

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:5173

### Access the Application

- **Public Website:** http://localhost:5173
- **Admin Login:** http://localhost:5173/admin/login
- **API Endpoints:** http://localhost:3000/api

**Default Admin Credentials:**

- Username: `admin`
- Password: `admin123`

**⚠️ Important:** Change the default admin password immediately after first login!

### Creating a New Admin User

To create a new admin user, you can use the PostgreSQL command line:

```bash
psql -U postgres -d glowbyhanka

-- Insert new admin user (password will be hashed by the application)
-- You'll need to hash the password first using bcrypt
-- Or modify the seed.js script to add your user
```

Alternatively, modify `backend/src/migrations/seed.js` to add your admin user and run `npm run seed` again.

## Testing

The project includes both unit tests and property-based tests for comprehensive coverage.

### Run All Backend Tests

```bash
cd backend
npm test
```

### Run All Frontend Tests

```bash
cd frontend
npm test
```

### Run Specific Test Files

**Backend:**

```bash
cd backend
npm test -- authService.test.js
npm test -- properties/passwordSecurity.property.test.js
```

**Frontend:**

```bash
cd frontend
npm test -- Header.test.jsx
npm test -- properties/navigationRouting.property.test.jsx
```

### Test Coverage

The test suite includes:

- **Unit Tests:** Specific functionality and edge cases
- **Property-Based Tests:** Universal properties across many inputs (100+ iterations each)
- **Integration Tests:** End-to-end workflows

## Technology Stack

### Backend

- **Node.js** & **Express.js** - Server framework
- **PostgreSQL** with **node-postgres (pg)** - Database
- **JWT (jsonwebtoken)** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email functionality
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Frontend

- **React 18** - UI framework
- **Vite** - Build tooling and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **fast-check** - Property-based testing

### Testing

- **Jest** - Backend testing framework
- **Vitest** - Frontend testing framework
- **Supertest** - HTTP assertion library
- **fast-check** - Property-based testing library

## API Documentation

### Public Endpoints

#### Get All Categories

```
GET /api/portfolio/categories
Response: Array of category objects
```

#### Get Images by Category

```
GET /api/portfolio/images/:categoryId
Response: Array of image objects for the category
```

#### Submit Contact Form

```
POST /api/contact
Body: { name: string, email: string, message: string }
Response: { success: boolean, message: string }
```

### Protected Admin Endpoints

All admin endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Admin Login

```
POST /api/auth/login
Body: { username: string, password: string }
Response: { success: boolean, token: string, user: object }
```

#### Upload Image

```
POST /api/admin/images
Headers: Authorization: Bearer <token>
Body: FormData with 'image' file and 'categoryId'
Response: { success: boolean, image: object, message: string }
```

#### Delete Image

```
DELETE /api/admin/images/:imageId
Headers: Authorization: Bearer <token>
Response: { success: boolean, message: string }
```

#### Get All Images

```
GET /api/admin/images
Headers: Authorization: Bearer <token>
Response: { success: boolean, images: array }
```

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Key considerations:

- Use environment-specific configuration
- Enable HTTPS/SSL
- Set strong JWT secrets
- Configure production database
- Set up file upload directory with proper permissions
- Enable security headers and rate limiting
- Set up monitoring and logging
- Configure automated backups

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running: `pg_isready`
2. Check your `DATABASE_URL` in `.env`
3. Ensure the database exists: `psql -U postgres -l`
4. Verify user permissions

### Port Already in Use

If port 3000 or 5173 is already in use:

**Backend:**

```bash
# Change PORT in backend/.env
PORT=3001
```

**Frontend:**

```bash
# Vite will automatically try the next available port
# Or specify in vite.config.js
```

### Email Not Sending

1. Verify SMTP credentials in `.env`
2. For Gmail, ensure you're using an App Password
3. Check firewall settings for SMTP port (587 or 465)
4. Test SMTP connection separately

### Image Upload Fails

1. Ensure `uploads` directory exists and has write permissions
2. Check `MAX_FILE_SIZE` setting
3. Verify file type is allowed (jpg, jpeg, png, webp)
4. Check disk space

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

ISC
