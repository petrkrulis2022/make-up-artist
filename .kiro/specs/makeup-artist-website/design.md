# Design Document: Glow by Hanka Make Up Artist Website

## Overview

The Glow by Hanka website is a full-stack web application built to showcase a professional makeup artist's portfolio and services. The application consists of a public-facing website in Czech language with an elegant, luxurious aesthetic, and a secure administrative interface for content management.

The architecture follows a modern full-stack approach with:

- **Frontend**: React-based single-page application with responsive design
- **Backend**: Node.js/Express REST API
- **Database**: PostgreSQL for persistent data storage
- **File Storage**: Local file system with organized directory structure for uploaded images
- **Authentication**: JWT-based authentication for admin access

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │           React Frontend Application                │    │
│  │  - Public Pages (Czech content)                     │    │
│  │  - Admin Panel (Protected)                          │    │
│  │  - Responsive UI Components                         │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    Node.js/Express Server                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │              API Routes & Controllers               │    │
│  │  - Public Routes (Portfolio, Contact)              │    │
│  │  - Protected Routes (Admin)                         │    │
│  │  - Authentication Middleware                        │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Business Logic Layer                   │    │
│  │  - Image Management Service                         │    │
│  │  - Email Service                                    │    │
│  │  - Authentication Service                           │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────┬──────────────────────────┬──────────────────┘
                │                          │
    ┌───────────▼──────────┐   ┌──────────▼──────────┐
    │  PostgreSQL Database │   │   File System       │
    │  - Image metadata    │   │   - Uploaded images │
    │  - Categories        │   │   - Logo files      │
    │  - Admin credentials │   │                     │
    └──────────────────────┘   └─────────────────────┘
```

### Technology Stack

**Frontend:**

- React 18+ with React Router for navigation
- CSS Modules or Styled Components for styling
- Axios for API communication
- React Hook Form for form handling
- React Image Gallery or similar for portfolio display

**Backend:**

- Node.js (v18+)
- Express.js for REST API
- Multer for file upload handling
- bcrypt for password hashing
- jsonwebtoken (JWT) for authentication
- nodemailer for email functionality
- cors for cross-origin requests

**Database:**

- PostgreSQL 14+
- node-postgres (pg) driver

**Development Tools:**

- Vite for frontend build tooling
- ESLint and Prettier for code quality
- dotenv for environment configuration

## Components and Interfaces

### Frontend Components

#### Public Components

1. **Layout Components**

   - `Header`: Logo, navigation menu, responsive hamburger menu
   - `Footer`: Copyright, social links (if needed)
   - `Navigation`: Main navigation with Czech labels

2. **Page Components**

   - `HomePage`: Hero section with headline, intro text, CTA button
   - `PortfolioPage`: Category selector and image gallery
   - `CoursesPage`: Course information display
   - `AboutPage`: Biography and professional information
   - `ContactPage`: Contact information and form

3. **Feature Components**
   - `ImageGallery`: Grid display of portfolio images with lightbox
   - `CategoryFilter`: Category selection for portfolio
   - `ContactForm`: Form with validation (Jméno, Email, Zpráva)
   - `Button`: Reusable styled button component
   - `ImageCard`: Individual image display with hover effects

#### Admin Components

1. **Admin Layout**

   - `AdminLayout`: Protected layout wrapper with admin navigation
   - `LoginForm`: Authentication form

2. **Admin Feature Components**
   - `ImageUpload`: File upload interface with category selection
   - `ImageManager`: Display and delete interface for existing images
   - `CategoryManager`: View images organized by category

### Backend API Endpoints

#### Public Endpoints

```
GET  /api/portfolio/categories
     Response: Array of category objects with names and IDs

GET  /api/portfolio/images/:categoryId
     Response: Array of image objects for specified category

POST /api/contact
     Body: { name, email, message }
     Response: Success confirmation
```

#### Protected Admin Endpoints

```
POST /api/auth/login
     Body: { username, password }
     Response: { token, user }

POST /api/admin/images
     Headers: Authorization: Bearer <token>
     Body: FormData with image file and categoryId
     Response: Created image object

DELETE /api/admin/images/:imageId
       Headers: Authorization: Bearer <token>
       Response: Success confirmation

GET /api/admin/images
    Headers: Authorization: Bearer <token>
    Response: Array of all images with metadata
```

### Service Interfaces

#### ImageService

```typescript
interface ImageService {
  uploadImage(file: File, categoryId: number, userId: number): Promise<Image>;
  deleteImage(imageId: number, userId: number): Promise<void>;
  getImagesByCategory(categoryId: number): Promise<Image[]>;
  getAllImages(): Promise<Image[]>;
}
```

#### AuthService

```typescript
interface AuthService {
  login(
    username: string,
    password: string
  ): Promise<{ token: string; user: User }>;
  verifyToken(token: string): Promise<User>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}
```

#### EmailService

```typescript
interface EmailService {
  sendContactEmail(name: string, email: string, message: string): Promise<void>;
}
```

## Data Models

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Categories Table

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_cs VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial data
INSERT INTO categories (name_cs, slug, display_order) VALUES
  ('Svatební líčení', 'svatebni-liceni', 1),
  ('Líčení na plesy a večírky', 'liceni-na-plesy-a-vecirky', 2),
  ('Slavnostní líčení', 'slavnostni-liceni', 3),
  ('Líčení pro focení', 'liceni-pro-foceni', 4);
```

#### Images Table

```sql
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_images_category ON images(category_id);
CREATE INDEX idx_images_display_order ON images(display_order);
```

### TypeScript Interfaces

```typescript
interface Category {
  id: number;
  name_cs: string;
  slug: string;
  display_order: number;
  created_at: Date;
}

interface Image {
  id: number;
  category_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_at: Date;
  display_order: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After reviewing all testable properties from the prework analysis, several redundancies and consolidation opportunities have been identified:

**Redundancies to Address:**

- Properties 10.1, 10.2, 10.3 (mobile, tablet, desktop layouts) can be consolidated into a single comprehensive responsive layout property
- Properties 8.3 and 9.3 (success confirmations) follow the same pattern and validate similar behavior
- Properties 8.4 and 9.4 (error messages) follow the same pattern and validate similar behavior
- Properties 3.2 and 3.3 both test category-based image filtering and can be combined
- Properties 8.5 and 9.5 both test gallery synchronization and can be combined into one bidirectional property

**Consolidated Properties:**
The following properties will be written to eliminate redundancy while maintaining comprehensive coverage:

- Single responsive layout property covering all viewport sizes
- Combined admin feedback property for success/error messages
- Single category filtering property that covers data retrieval and display
- Single gallery synchronization property covering both additions and deletions

### Testable Correctness Properties

Property 1: Navigation links route correctly
_For any_ navigation link in the menu, clicking that link should navigate to the corresponding page or section
**Validates: Requirements 2.2**

Property 2: Responsive navigation adaptation
_For any_ viewport size, the navigation menu should display in a format appropriate for that screen width (hamburger menu for mobile, full menu for desktop)
**Validates: Requirements 2.5**

Property 3: Category-based image filtering
_For any_ portfolio category selection, the displayed images should only include images associated with that specific category from the database
**Validates: Requirements 3.2, 3.3**

Property 4: Responsive grid layout
_For any_ viewport size (mobile, tablet, desktop), the image gallery should adapt its column count and layout to provide optimal viewing for that screen size
**Validates: Requirements 3.5, 10.1, 10.2, 10.3**

Property 5: Contact form validation
_For any_ invalid form submission (missing required fields, invalid email format), the contact form should display appropriate validation error messages in Czech language and prevent submission
**Validates: Requirements 6.5**

Property 6: Contact form email delivery
_For any_ valid contact form submission, the system should send an email containing the submitted name, email, and message to the configured recipient address
**Validates: Requirements 6.4**

Property 7: Authentication rejection
_For any_ invalid credentials (wrong username, wrong password, or both), the authentication system should deny access and display an error message in Czech language
**Validates: Requirements 7.2**

Property 8: Protected route access control
_For any_ protected admin route accessed without valid authentication, the system should redirect to the login page
**Validates: Requirements 7.5**

Property 9: Session expiration enforcement
_For any_ expired or logged-out session, subsequent attempts to access protected routes should require re-authentication
**Validates: Requirements 7.4**

Property 10: Image upload and categorization
_For any_ valid image file uploaded with a category selection, the system should store the image file and create a database record associating it with the selected category
**Validates: Requirements 8.2**

Property 11: Gallery synchronization after upload
_For any_ image added to a category, that image should appear in the corresponding portfolio gallery on the public website after page refresh
**Validates: Requirements 8.5**

Property 12: Admin operation feedback
_For any_ successful admin operation (image upload or deletion), the admin panel should display a confirmation message in Czech language
**Validates: Requirements 8.3, 9.3**

Property 13: Admin error handling
_For any_ failed admin operation (upload failure, deletion failure), the admin panel should display an error message in Czech language
**Validates: Requirements 8.4, 9.4**

Property 14: Image deletion completeness
_For any_ image deleted through the admin panel, that image should be removed from the database and no longer appear in any portfolio gallery
**Validates: Requirements 9.2, 9.5**

Property 15: Delete option availability
_For any_ image displayed in the admin management interface, a delete option should be available
**Validates: Requirements 9.1**

Property 16: Dynamic layout responsiveness
_For any_ browser window resize operation, the website layout should adapt dynamically to the new viewport dimensions
**Validates: Requirements 10.4**

Property 17: Touch target sizing
_For any_ interactive element (button, link, form input) on touch devices, the touch target should meet minimum size requirements for finger interaction (minimum 44x44 pixels)
**Validates: Requirements 10.5**

Property 18: Data persistence after restart
_For any_ data stored in the database (image metadata, category associations), that data should remain accessible and unchanged after a server restart
**Validates: Requirements 12.1, 12.2**

Property 19: Database query accuracy
_For any_ database query executed by the website, the returned data should accurately reflect the current state of the database
**Validates: Requirements 12.3**

Property 20: Password security
_For any_ admin password stored in the database, the password should be hashed (not stored in plain text) using a secure hashing algorithm
**Validates: Requirements 12.4**

## Error Handling

### Frontend Error Handling

**Network Errors:**

- Display user-friendly error messages in Czech when API calls fail
- Implement retry logic for transient failures
- Show loading states during API operations
- Gracefully handle timeout scenarios

**Form Validation Errors:**

- Real-time validation feedback for form inputs
- Clear error messages in Czech for each validation rule
- Prevent form submission until all validations pass
- Highlight invalid fields visually

**Image Loading Errors:**

- Display placeholder or error icon when images fail to load
- Log errors for debugging purposes
- Implement lazy loading with error boundaries

**Authentication Errors:**

- Clear messaging for invalid credentials
- Session expiration notifications
- Automatic redirect to login when token expires
- Secure token storage in httpOnly cookies or secure localStorage

### Backend Error Handling

**Request Validation:**

- Validate all incoming request data
- Return appropriate HTTP status codes (400 for bad requests, 401 for unauthorized, 404 for not found, 500 for server errors)
- Provide descriptive error messages in response body
- Log validation errors for monitoring

**Database Errors:**

- Wrap database operations in try-catch blocks
- Handle connection failures gracefully
- Implement connection pooling for reliability
- Log database errors with context
- Return generic error messages to clients (don't expose internal details)

**File Upload Errors:**

- Validate file types (only allow image formats: jpg, jpeg, png, webp)
- Enforce file size limits (e.g., max 5MB per image)
- Handle disk space errors
- Clean up partial uploads on failure
- Provide specific error messages for different failure types

**Authentication Errors:**

- Rate limiting for login attempts to prevent brute force attacks
- Secure password comparison using bcrypt
- Token expiration handling
- Invalid token detection and rejection

### Error Response Format

All API errors should follow a consistent format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

Example error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Neplatné přihlašovací údaje"
  }
}

{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Soubor je příliš velký. Maximální velikost je 5MB."
  }
}
```

## Testing Strategy

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for universal correctness properties.

### Unit Testing

**Frontend Unit Tests:**

- Component rendering tests for all page components
- User interaction tests (button clicks, form submissions)
- Navigation routing tests
- Form validation logic tests
- API integration tests with mocked responses
- Specific edge cases:
  - Empty portfolio categories (3.4)
  - Homepage content display (1.1, 1.2, 1.3)
  - Contact page elements (6.1, 6.2, 6.3)
  - Admin login form display (7.1)

**Backend Unit Tests:**

- API endpoint tests for all routes
- Authentication middleware tests
- Database query tests with test database
- File upload handling tests
- Email service tests with mock SMTP
- Specific scenarios:
  - Valid authentication (7.3)
  - Admin interface display (8.1)
  - Specific page content (4.1, 4.2, 5.1, 5.2)

**Testing Framework:**

- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest
- Database: PostgreSQL test database with migrations

### Property-Based Testing

Property-based tests verify that universal properties hold across a wide range of inputs, providing stronger correctness guarantees than example-based tests alone.

**Testing Library:**

- JavaScript/TypeScript: fast-check

**Configuration:**

- Each property test MUST run a minimum of 100 iterations
- Each property test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: makeup-artist-website, Property {number}: {property_text}`

**Property Test Coverage:**

Each of the 20 correctness properties defined above will be implemented as a property-based test:

1. **Property 1 (Navigation)**: Generate random navigation links, verify routing
2. **Property 2 (Responsive Nav)**: Generate random viewport widths, verify menu adaptation
3. **Property 3 (Category Filtering)**: Generate random categories and images, verify filtering
4. **Property 4 (Responsive Grid)**: Generate random viewport sizes, verify grid adaptation
5. **Property 5 (Form Validation)**: Generate random invalid form data, verify error messages
6. **Property 6 (Email Delivery)**: Generate random valid form data, verify email sent
7. **Property 7 (Auth Rejection)**: Generate random invalid credentials, verify rejection
8. **Property 8 (Route Protection)**: Generate random protected routes, verify redirect without auth
9. **Property 9 (Session Expiration)**: Generate random expired sessions, verify re-auth required
10. **Property 10 (Image Upload)**: Generate random valid images and categories, verify storage
11. **Property 11 (Gallery Sync Upload)**: Generate random images, verify gallery display
12. **Property 12 (Admin Feedback)**: Generate random successful operations, verify confirmation
13. **Property 13 (Admin Errors)**: Generate random failure scenarios, verify error messages
14. **Property 14 (Image Deletion)**: Generate random images to delete, verify removal
15. **Property 15 (Delete Options)**: Generate random image sets, verify delete buttons present
16. **Property 16 (Dynamic Resize)**: Generate random resize operations, verify layout adaptation
17. **Property 17 (Touch Targets)**: Generate random interactive elements, verify minimum size
18. **Property 18 (Data Persistence)**: Generate random data, restart system, verify persistence
19. **Property 19 (Query Accuracy)**: Generate random queries, verify correct results
20. **Property 20 (Password Security)**: Generate random passwords, verify hashing

**Generator Strategies:**

- **Viewport sizes**: Generate widths from 320px to 2560px
- **Form data**: Generate strings with various lengths, special characters, valid/invalid emails
- **Credentials**: Generate random username/password combinations
- **Images**: Generate mock file objects with various sizes and types
- **Categories**: Use the four defined categories with random selection
- **Database records**: Generate random but valid data matching schema constraints

### Integration Testing

- End-to-end tests for critical user flows:
  - Public user browsing portfolio
  - Admin logging in and uploading images
  - Contact form submission and email delivery
- Test with real database (test instance)
- Test file upload and storage
- Test authentication flow completely

### Test Organization

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx
│   │   └── pages/
│   │       ├── HomePage.tsx
│   │       └── HomePage.test.tsx
│   └── tests/
│       ├── integration/
│       └── properties/
│           ├── navigation.property.test.ts
│           ├── responsive.property.test.ts
│           └── forms.property.test.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── portfolio.ts
│   │   │   └── portfolio.test.ts
│   │   └── services/
│   │       ├── imageService.ts
│   │       └── imageService.test.ts
│   └── tests/
│       ├── integration/
│       └── properties/
│           ├── auth.property.test.ts
│           ├── upload.property.test.ts
│           └── persistence.property.test.ts
```

## Security Considerations

### Authentication & Authorization

- JWT tokens with reasonable expiration (e.g., 24 hours)
- Secure password hashing with bcrypt (minimum 10 rounds)
- HTTP-only cookies for token storage (if using cookies)
- CSRF protection for state-changing operations
- Rate limiting on login endpoint

### Input Validation

- Sanitize all user inputs to prevent XSS attacks
- Validate file uploads (type, size, content)
- Parameterized database queries to prevent SQL injection
- Validate and sanitize contact form inputs

### File Upload Security

- Restrict allowed file types to images only
- Validate file content (not just extension)
- Generate unique filenames to prevent overwrites
- Store uploaded files outside web root
- Implement file size limits

### API Security

- CORS configuration to allow only trusted origins
- HTTPS enforcement in production
- Security headers (Helmet.js)
- Request size limits
- API rate limiting

## Deployment Considerations

### Environment Configuration

Required environment variables:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/glowbyhanka
DATABASE_TEST_URL=postgresql://user:password@localhost:5432/glowbyhanka_test

# JWT
JWT_SECRET=<secure-random-string>
JWT_EXPIRATION=24h

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=info@glowbyhanka.cz
SMTP_PASSWORD=<email-password>
SMTP_FROM=info@glowbyhanka.cz

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://glowbyhanka.cz
```

### Database Setup

1. Create PostgreSQL database
2. Run migrations to create tables
3. Seed initial data (categories, admin user)
4. Set up regular backups

### File Storage

- Create uploads directory with proper permissions
- Organize by category: `/uploads/svatebni-liceni/`, `/uploads/liceni-na-plesy-a-vecirky/`, etc.
- Implement backup strategy for uploaded images
- Consider CDN for production (optional future enhancement)

### Production Checklist

- [ ] Set all environment variables
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database with migrations
- [ ] Create admin user account
- [ ] Configure email service
- [ ] Set up file upload directory
- [ ] Enable security headers
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Test all functionality in production environment

## Future Enhancements

Potential features for future iterations:

- Image optimization and thumbnail generation
- Drag-and-drop reordering of images in admin panel
- Multiple admin users with different permission levels
- Analytics integration
- SEO optimization with meta tags
- Social media integration
- Online booking system
- Client testimonials section
- Blog or news section
- Multi-language support (English version)
- Progressive Web App (PWA) capabilities
- Image lazy loading and progressive loading
- Advanced image gallery with zoom and slideshow
