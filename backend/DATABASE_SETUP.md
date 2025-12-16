# Database Setup Instructions

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed

## Setup Steps

### 1. Create Databases

Create both development and test databases:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create development database
CREATE DATABASE glowbyhanka;

# Create test database
CREATE DATABASE glowbyhanka_test;

# Exit psql
\q
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the database connection strings:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/glowbyhanka
DATABASE_TEST_URL=postgresql://your_username:your_password@localhost:5432/glowbyhanka_test
```

### 3. Run Migrations

Run the database migrations to create all tables:

```bash
npm run migrate
```

This will create:

- `users` table
- `categories` table
- `images` table

### 4. Seed Initial Data

Seed the database with initial categories and admin user:

```bash
npm run seed
```

This will create:

- Four portfolio categories (Svatební líčení, Líčení na plesy a večírky, Slavnostní líčení, Líčení pro focení)
- Initial admin user (default username: `admin`, password: `admin123`)

**Important:** Change the admin password in production!

### 5. Verify Setup

You can verify the setup by connecting to the database:

```bash
psql -U your_username -d glowbyhanka

# List tables
\dt

# View categories
SELECT * FROM categories;

# View users
SELECT id, username, email FROM users;
```

## Running Tests

Before running tests, ensure the test database is set up:

```bash
# Set NODE_ENV to test
export NODE_ENV=test

# Run migrations on test database
npm run migrate

# Run tests
npm test
```

## Troubleshooting

### Connection Refused

If you get "connection refused" errors:

1. Ensure PostgreSQL is running: `sudo service postgresql status`
2. Check your connection string in `.env`
3. Verify PostgreSQL is listening on port 5432

### Authentication Failed

If you get authentication errors:

1. Check your PostgreSQL username and password
2. Update `pg_hba.conf` if needed to allow password authentication
3. Restart PostgreSQL after configuration changes

### Permission Denied

If you get permission errors:

1. Ensure your PostgreSQL user has CREATE DATABASE privileges
2. Grant necessary permissions: `GRANT ALL PRIVILEGES ON DATABASE glowbyhanka TO your_username;`
