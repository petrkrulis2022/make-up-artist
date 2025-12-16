# Implementation Plan

- [x] 1. Set up project structure and initialize both frontend and backend

  - Create root directory structure with separate frontend and backend folders
  - Initialize Node.js project in backend folder with Express, PostgreSQL driver, JWT, bcrypt, multer, nodemailer
  - Initialize React project in frontend folder with Vite, React Router, Axios
  - Set up environment configuration files (.env.example) for both frontend and backend
  - Create .gitignore files to exclude node_modules, .env, and uploads directory
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up database schema and connection

  - [x] 2.1 Create PostgreSQL database connection module

    - Write database connection utility using node-postgres (pg)
    - Implement connection pooling for reliability
    - Add error handling for connection failures
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 2.2 Create database migration files for all tables

    - Write migration for users table with id, username, password_hash, email, created_at
    - Write migration for categories table with id, name_cs, slug, display_order, created_at
    - Write migration for images table with all required fields and foreign key constraints
    - Add indexes for category_id and display_order on images table
    - _Requirements: 12.1, 12.2_

  - [x] 2.3 Create database seed file with initial data

    - Seed four categories: "Svatební líčení", "Líčení na plesy a večírky", "Slavnostní líčení", "Líčení pro focení"
    - Create initial admin user with hashed password
    - _Requirements: 3.1, 7.1_

  - [x] 2.4 Write property test for data persistence

    - **Property 18: Data persistence after restart**
    - **Validates: Requirements 12.1, 12.2**

  - [x] 2.5 Write property test for database query accuracy

    - **Property 19: Database query accuracy**
    - **Validates: Requirements 12.3**

- [x] 3. Implement backend authentication system

  - [x] 3.1 Create authentication service module

    - Implement password hashing function using bcrypt (minimum 10 rounds)
    - Implement password comparison function
    - Implement JWT token generation with 24-hour expiration
    - Implement JWT token verification function
    - _Requirements: 7.2, 7.3, 12.4_

  - [x] 3.2 Create authentication middleware

    - Write middleware to verify JWT tokens from Authorization header
    - Extract user information from valid tokens
    - Handle expired or invalid tokens with appropriate error responses
    - _Requirements: 7.4, 7.5_

  - [x] 3.3 Create login API endpoint

    - Implement POST /api/auth/login route
    - Validate username and password from request body
    - Return JWT token and user info on successful authentication
    - Return error message in Czech on authentication failure
    - _Requirements: 7.2, 7.3_

  - [x] 3.4 Write property test for password security

    - **Property 20: Password security**
    - **Validates: Requirements 12.4**

  - [x] 3.5 Write property test for authentication rejection

    - **Property 7: Authentication rejection**
    - **Validates: Requirements 7.2**

  - [x] 3.6 Write unit tests for authentication service

    - Test password hashing produces different hashes for same password
    - Test password comparison correctly validates passwords
    - Test JWT token generation and verification
    - _Requirements: 7.2, 7.3, 12.4_

- [x] 4. Implement backend image management service

  - [x] 4.1 Create image service module

    - Implement function to save uploaded image file to disk with unique filename
    - Implement function to create image database record with metadata
    - Implement function to retrieve images by category from database
    - Implement function to retrieve all images from database
    - Implement function to delete image file from disk and database record
    - _Requirements: 8.2, 9.2, 3.2, 3.3_

  - [x] 4.2 Set up file upload middleware with Multer

    - Configure Multer for image uploads with file size limit (5MB)
    - Set up file type validation (only jpg, jpeg, png, webp)
    - Configure destination directory for uploads organized by category
    - Generate unique filenames to prevent overwrites
    - _Requirements: 8.2_

  - [x] 4.3 Write property test for image upload and categorization

    - **Property 10: Image upload and categorization**
    - **Validates: Requirements 8.2**

  - [x] 4.4 Write property test for image deletion completeness

    - **Property 14: Image deletion completeness**
    - **Validates: Requirements 9.2, 9.5**

- [x] 5. Create backend API routes for portfolio management

  - [x] 5.1 Create public portfolio routes

    - Implement GET /api/portfolio/categories to return all categories
    - Implement GET /api/portfolio/images/:categoryId to return images for specific category
    - Add error handling for invalid category IDs
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Create protected admin image routes

    - Implement POST /api/admin/images with authentication middleware for image upload
    - Implement DELETE /api/admin/images/:imageId with authentication middleware for image deletion
    - Implement GET /api/admin/images with authentication middleware to retrieve all images
    - Return success/error messages in Czech language
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

  - [x] 5.3 Write property test for protected route access control

    - **Property 8: Protected route access control**
    - **Validates: Requirements 7.5**

  - [x] 5.4 Write unit tests for portfolio API endpoints

    - Test GET /api/portfolio/categories returns all four categories
    - Test GET /api/portfolio/images/:categoryId returns correct images
    - Test GET /api/portfolio/images/:categoryId with invalid ID returns error
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Implement backend contact form email service

  - [x] 6.1 Create email service module

    - Configure nodemailer with SMTP settings from environment variables
    - Implement function to send contact form emails
    - Format email with sender name, email, and message
    - Add error handling for email sending failures
    - _Requirements: 6.4_

  - [x] 6.2 Create contact form API endpoint

    - Implement POST /api/contact route
    - Validate request body contains name, email, and message
    - Validate email format
    - Call email service to send message
    - Return success/error response in Czech
    - _Requirements: 6.4, 6.5_

  - [x] 6.3 Write property test for contact form email delivery

    - **Property 6: Contact form email delivery**
    - **Validates: Requirements 6.4**

  - [x] 6.4 Write property test for contact form validation

    - **Property 5: Contact form validation**
    - **Validates: Requirements 6.5**

- [x] 7. Set up backend error handling and security

  - [x] 7.1 Create centralized error handling middleware

    - Implement error handler that catches all errors
    - Format error responses consistently with success: false, error code, and message
    - Log errors with context for debugging
    - Return appropriate HTTP status codes
    - _Requirements: All error handling requirements_

  - [x] 7.2 Add security middleware

    - Install and configure Helmet.js for security headers
    - Configure CORS to allow frontend origin
    - Add request size limits
    - Add rate limiting for login endpoint
    - _Requirements: 7.2_

  - [x] 7.3 Write unit tests for error handling

    - Test error responses have correct format
    - Test appropriate status codes are returned
    - Test error messages are in Czech
    - _Requirements: 6.5, 7.2, 8.4, 9.4_

- [x] 8. Checkpoint - Ensure backend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create frontend project structure and routing

  - [x] 9.1 Set up React Router with all page routes

    - Configure routes for Domů (/), Portfolio (/portfolio), Kurzy líčení (/kurzy), O mně (/o-mne), Kontakt (/kontakt)
    - Configure admin routes for login (/admin/login) and dashboard (/admin/dashboard)
    - Set up protected route wrapper for admin pages
    - _Requirements: 2.2, 7.5_

  - [x] 9.2 Create base layout components

    - Create Header component with logo and navigation menu
    - Create Footer component with copyright
    - Create Navigation component with Czech labels: "Domů", "Portfolio", "Kurzy líčení", "O mně", "Kontakt"
    - Implement logo click navigation to homepage
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 9.3 Write property test for navigation routing

    - **Property 1: Navigation links route correctly**
    - **Validates: Requirements 2.2**

  - [x] 9.4 Write unit tests for layout components

    - Test Header displays logo and navigation
    - Test Navigation contains all required links with Czech labels
    - Test logo click navigates to homepage
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 10. Implement responsive navigation with mobile menu

  - [x] 10.1 Create responsive navigation component

    - Implement hamburger menu for mobile viewports (< 768px)
    - Implement full horizontal menu for desktop viewports (>= 768px)
    - Add smooth transitions between menu states
    - Ensure menu is accessible with keyboard navigation
    - _Requirements: 2.5, 10.1, 10.2, 10.3_

  - [x] 10.2 Write property test for responsive navigation adaptation

    - **Property 2: Responsive navigation adaptation**
    - **Validates: Requirements 2.5**

- [x] 11. Create global styles and theme

  - [x] 11.1 Set up CSS variables and global styles

    - Define color palette: dark brown/taupe (#8B7355), gold (#D4AF37), white (#FFFFFF)
    - Define typography scale and font families
    - Create responsive breakpoints (mobile: 320-767px, tablet: 768-1023px, desktop: 1024px+)
    - Set up global reset and base styles
    - _Requirements: 1.5, 10.1, 10.2, 10.3_

  - [x] 11.2 Create reusable UI components

    - Create Button component with primary and secondary variants
    - Create Card component for content containers
    - Create Input component for form fields
    - Ensure all interactive elements meet minimum touch target size (44x44px)
    - _Requirements: 10.5_

  - [x] 11.3 Write property test for touch target sizing

    - **Property 17: Touch target sizing**
    - **Validates: Requirements 10.5**

- [-] 12. Implement homepage (Domů)

  - [x] 12.1 Create HomePage component

    - Display headline "Rozzařte svou krásu s Glow by Hanka"
    - Display introductory text in Czech
    - Add "Prohlédnout Portfolio" call-to-action button
    - Implement button click navigation to Portfolio page
    - Apply elegant styling with color palette
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 12.2 Write unit tests for HomePage

    - Test headline is displayed correctly
    - Test intro text is present
    - Test CTA button is present with correct label
    - Test CTA button navigates to Portfolio page
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [-] 13. Implement Portfolio page with category filtering

  - [x] 13.1 Create API service functions for portfolio

    - Create function to fetch all categories from backend
    - Create function to fetch images by category ID from backend
    - Add error handling for failed API calls
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 13.2 Create PortfolioPage component

    - Display category filter buttons for all four categories
    - Fetch and display categories on component mount
    - Implement category selection state management
    - Display selected category name
    - _Requirements: 3.1_

  - [x] 13.3 Create ImageGallery component

    - Fetch images for selected category from API
    - Display images in responsive grid layout
    - Implement grid that adapts: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
    - Display "Žádné obrázky" message when category is empty
    - Add loading state while fetching images
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ] 13.4 Write property test for category-based image filtering

    - **Property 3: Category-based image filtering**
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 13.5 Write property test for responsive grid layout

    - **Property 4: Responsive grid layout**
    - **Validates: Requirements 3.5, 10.1, 10.2, 10.3**

  - [ ] 13.6 Write property test for gallery synchronization

    - **Property 11: Gallery synchronization after upload**
    - **Validates: Requirements 8.5**

  - [ ] 13.7 Write unit tests for Portfolio page
    - Test all four category buttons are displayed
    - Test category selection updates displayed images
    - Test empty category displays appropriate message
    - _Requirements: 3.1, 3.2, 3.4_

- [-] 14. Implement Kurzy líčení (Courses) page

  - [x] 14.1 Create CoursesPage component

    - Display title "Kurzy líčení"
    - Display course description text in Czech
    - Apply consistent styling with theme
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 14.2 Write unit tests for CoursesPage

    - Test title is displayed
    - Test course description text is present
    - Test description includes information about individual/group courses
    - _Requirements: 4.1, 4.2, 4.3_

- [-] 15. Implement O mně (About) page

  - [x] 15.1 Create AboutPage component

    - Display title "O mně"
    - Display biographical text about Hanka in Czech
    - Apply consistent styling with theme
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 15.2 Write unit tests for AboutPage

    - Test title is displayed
    - Test biographical text is present
    - Test text includes experience, specialization, and philosophy
    - _Requirements: 5.1, 5.2, 5.3_

- [-] 16. Implement Kontakt (Contact) page with form

  - [x] 16.1 Create ContactPage component

    - Display title "Kontakt"
    - Display introductory text in Czech
    - Display contact information: email, phone, address
    - _Requirements: 6.1, 6.2_

  - [x] 16.2 Create ContactForm component

    - Create form with fields: Jméno (name), Email, Zpráva (message)
    - Implement form validation: required fields, email format
    - Display validation errors in Czech
    - Implement form submission to backend API
    - Display success message after successful submission
    - Display error message if submission fails
    - Clear form after successful submission
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 16.3 Write unit tests for ContactPage

    - Test title and intro text are displayed
    - Test contact information is displayed correctly
    - Test form has all required fields with Czech labels
    - _Requirements: 6.1, 6.2, 6.3_

- [-] 17. Implement responsive layout system

  - [x] 17.1 Add responsive styles to all page components

    - Ensure all pages adapt layout for mobile, tablet, and desktop
    - Test layouts at breakpoints: 320px, 768px, 1024px, 1920px
    - Implement mobile-first CSS approach
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 17.2 Write property test for dynamic layout responsiveness

    - **Property 16: Dynamic layout responsiveness**
    - **Validates: Requirements 10.4**

- [ ] 18. Checkpoint - Ensure frontend public pages tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement admin authentication UI

  - [x] 19.1 Create LoginPage component

    - Display login form with username and password fields
    - Implement form validation
    - Call login API endpoint on form submission
    - Store JWT token in localStorage on successful login
    - Display error message in Czech on login failure
    - Redirect to admin dashboard after successful login
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 19.2 Create ProtectedRoute component

    - Check for valid JWT token before rendering admin routes
    - Redirect to login page if no token or token is invalid
    - Verify token with backend on mount
    - _Requirements: 7.5_

  - [x] 19.3 Implement logout functionality

    - Create logout function that clears token from localStorage
    - Add logout button in admin layout
    - Redirect to login page after logout
    - _Requirements: 7.4_

  - [x] 19.4 Write property test for session expiration enforcement

    - **Property 9: Session expiration enforcement**
    - **Validates: Requirements 7.4**

  - [x] 19.5 Write unit tests for authentication UI

    - Test login form displays correctly
    - Test login form validates inputs
    - Test successful login stores token and redirects
    - Test failed login displays error in Czech
    - Test protected routes redirect when not authenticated
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 20. Implement admin dashboard layout

  - [x] 20.1 Create AdminLayout component

    - Create admin header with logout button
    - Create admin navigation menu
    - Apply admin-specific styling
    - _Requirements: 8.1, 9.1_

  - [x] 20.2 Create AdminDashboard page component

    - Display welcome message
    - Display links to image management sections
    - Show summary of images by category
    - _Requirements: 8.1, 9.1_

- [x] 21. Implement admin image upload functionality

  - [x] 21.1 Create ImageUpload component

    - Create file input for image selection
    - Create category dropdown with all four categories
    - Implement image preview before upload
    - Validate file type (only images) and size (max 5MB) on client side
    - Display validation errors in Czech
    - _Requirements: 8.1, 8.2_

  - [x] 21.2 Implement image upload API integration

    - Create function to upload image with FormData to backend
    - Include JWT token in Authorization header
    - Handle upload progress indication
    - Display success confirmation message in Czech after upload
    - Display error message in Czech if upload fails
    - Refresh image list after successful upload
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 21.3 Write property test for admin operation feedback

    - **Property 12: Admin operation feedback**
    - **Validates: Requirements 8.3, 9.3**

  - [x] 21.4 Write property test for admin error handling

    - **Property 13: Admin error handling**
    - **Validates: Requirements 8.4, 9.4**

- [x] 22. Implement admin image management interface

  - [x] 22.1 Create ImageManager component

    - Fetch all images from backend with authentication
    - Display images organized by category
    - Show image thumbnail, filename, and category
    - Add delete button for each image
    - _Requirements: 9.1_

  - [x] 22.2 Implement image deletion functionality

    - Add confirmation dialog before deletion
    - Call delete API endpoint with image ID and JWT token
    - Display success confirmation message in Czech after deletion
    - Display error message in Czech if deletion fails
    - Remove deleted image from UI immediately
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [x] 22.3 Write property test for delete option availability

    - **Property 15: Delete option availability**
    - **Validates: Requirements 9.1**

  - [x] 22.4 Write unit tests for image management

    - Test ImageManager displays all images
    - Test each image has delete button
    - Test delete confirmation dialog appears
    - Test successful deletion removes image from UI
    - Test deletion displays success message in Czech
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 23. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Create deployment documentation

  - [x] 24.1 Write README.md with setup instructions

    - Document prerequisites (Node.js, PostgreSQL)
    - Document installation steps for both frontend and backend
    - Document environment variable configuration
    - Document database setup and migration commands
    - Document how to create initial admin user
    - Document how to run development servers
    - Document how to run tests
    - _Requirements: All requirements_

  - [x] 24.2 Create production deployment guide

    - Document production environment setup
    - Document build commands for frontend and backend
    - Document database migration process for production
    - Document file upload directory setup
    - Document security checklist
    - _Requirements: All requirements_
