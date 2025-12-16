# Task 4: Backend Image Management Service - Implementation Summary

## Overview

Successfully implemented the complete backend image management service including file upload handling, database operations, and property-based tests.

## Completed Subtasks

### 4.1 Create Image Service Module ✅

**File:** `backend/src/services/imageService.js`

Implemented five core functions:

1. **saveImageFile(file, categorySlug)**

   - Saves uploaded image files to disk with unique timestamp-based filenames
   - Organizes files by category in subdirectories
   - Creates directories recursively if they don't exist
   - Returns file metadata (filename, filepath, size, mimetype)

2. **createImageRecord(imageData)**

   - Creates database records for uploaded images
   - Stores metadata: category_id, filename, original_filename, file_path, file_size, mime_type, uploaded_by
   - Returns the created image record with ID

3. **getImagesByCategory(categoryId)**

   - Retrieves all images for a specific category
   - Orders by display_order ASC, then uploaded_at DESC
   - Returns array of image records

4. **getAllImages()**

   - Retrieves all images from database
   - Joins with categories table to include category name and slug
   - Orders by category display_order, image display_order, and upload date
   - Returns array of image records with category information

5. **deleteImage(imageId, userId)**
   - Deletes image file from disk
   - Removes database record
   - Handles errors gracefully (continues with DB deletion even if file deletion fails)
   - Logs deletion activity

**Requirements Validated:** 8.2, 9.2, 3.2, 3.3

### 4.2 Set Up File Upload Middleware with Multer ✅

**File:** `backend/src/middleware/uploadMiddleware.js`

Implemented comprehensive file upload middleware:

1. **File Type Validation**

   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
   - Allowed extensions: .jpg, .jpeg, .png, .webp
   - Rejects invalid file types with Czech error messages

2. **File Size Limits**

   - Maximum file size: 5MB (5,242,880 bytes)
   - Configurable via MAX_FILE_SIZE environment variable
   - Returns Czech error message when limit exceeded

3. **Storage Configuration**

   - Uses memory storage (multer.memoryStorage())
   - Allows custom file naming and organization in imageService
   - Provides file buffer for processing

4. **Middleware Exports**

   - `uploadSingleImage`: Handles single file upload (field name: "image")
   - `uploadMultipleImages`: Handles up to 10 files (field name: "images")
   - `handleUploadError`: Error handling middleware with Czech error messages

5. **Error Handling**
   - LIMIT_FILE_SIZE: "Soubor je příliš velký. Maximální velikost je 5MB."
   - LIMIT_FILE_COUNT: "Příliš mnoho souborů. Maximální počet je 10."
   - LIMIT_UNEXPECTED_FILE: "Neočekávané pole souboru."
   - INVALID_FILE: Custom validation error messages
   - UPLOAD_ERROR: Generic upload error

**Requirements Validated:** 8.2

### 4.3 Write Property Test for Image Upload and Categorization ✅

**File:** `backend/tests/properties/imageUploadCategorization.property.test.js`

**Property 10: Image upload and categorization**
**Validates: Requirements 8.2**

Implemented comprehensive property-based test:

1. **Test Strategy**

   - Generates 100 random valid image files with varying properties
   - Tests the complete upload workflow: save file → create record → verify categorization

2. **Random Input Generation**

   - Original filenames: 5-30 characters, sanitized
   - File sizes: 1KB to 5MB
   - MIME types: image/jpeg, image/jpg, image/png, image/webp
   - File content: Random byte arrays (100-1000 bytes)

3. **Verification Steps**

   - File saved to disk with correct properties
   - File physically exists on disk
   - Database record created with correct metadata
   - Image associated with correct category
   - Image appears in category gallery

4. **Test Setup**
   - Creates isolated test user and category
   - Uses separate test upload directory
   - Cleans up after each test run
   - Closes database connections properly

### 4.4 Write Property Test for Image Deletion Completeness ✅

**File:** `backend/tests/properties/imageDeletion.property.test.js`

**Property 14: Image deletion completeness**
**Validates: Requirements 9.2, 9.5**

Implemented comprehensive property-based test:

1. **Test Strategy**

   - Generates 100 random images
   - Tests complete deletion workflow: create → verify existence → delete → verify removal

2. **Random Input Generation**

   - Same generators as upload test for consistency
   - Creates realistic image scenarios

3. **Verification Steps (Before Deletion)**

   - Image exists in database
   - File exists on disk
   - Image appears in category gallery
   - Image appears in all images list

4. **Verification Steps (After Deletion)**

   - Image removed from database
   - File removed from disk
   - Image no longer in category gallery
   - Image no longer in all images list

5. **Test Setup**
   - Isolated test environment
   - Proper cleanup of test data
   - Handles file system errors gracefully

## Files Created

1. `backend/src/services/imageService.js` - Core image management service
2. `backend/src/middleware/uploadMiddleware.js` - Multer configuration and validation
3. `backend/tests/properties/imageUploadCategorization.property.test.js` - Property test for upload
4. `backend/tests/properties/imageDeletion.property.test.js` - Property test for deletion
5. `backend/test-image-service.js` - Manual test script for verification

## Key Features

### Security

- File type validation (MIME type and extension)
- File size limits (5MB)
- Unique filename generation to prevent overwrites
- User ID tracking for all operations

### Error Handling

- Comprehensive error messages in Czech language
- Graceful handling of file system errors
- Database transaction safety
- Detailed error logging

### Organization

- Files organized by category in subdirectories
- Timestamp-based unique filenames
- Configurable upload directory via environment variables

### Testing

- 200 total property test iterations (100 per property)
- Comprehensive coverage of upload and deletion workflows
- Isolated test environments
- Proper cleanup and resource management

## Environment Variables Used

```
UPLOAD_DIR=./uploads              # Base directory for uploads
MAX_FILE_SIZE=5242880             # Maximum file size (5MB)
NODE_ENV=test                     # Test environment flag
```

## Database Schema Used

### images table

- id (SERIAL PRIMARY KEY)
- category_id (INTEGER, FOREIGN KEY)
- filename (VARCHAR)
- original_filename (VARCHAR)
- file_path (VARCHAR)
- file_size (INTEGER)
- mime_type (VARCHAR)
- uploaded_by (INTEGER, FOREIGN KEY)
- uploaded_at (TIMESTAMP)
- display_order (INTEGER)

## Next Steps

To use this image management service:

1. **In API Routes**: Import the service functions and use them in route handlers
2. **For Upload**: Use `uploadSingleImage` middleware, then call `saveImageFile` and `createImageRecord`
3. **For Retrieval**: Call `getImagesByCategory` or `getAllImages`
4. **For Deletion**: Call `deleteImage` with image ID and user ID

Example usage will be implemented in Task 5 (Create backend API routes for portfolio management).

## Testing

To run the property tests:

```bash
cd backend
npm test
```

To run specific property tests:

```bash
npm test imageUploadCategorization.property.test.js
npm test imageDeletion.property.test.js
```

## Requirements Validation

✅ Requirement 8.2: Image upload with category association
✅ Requirement 9.2: Image deletion from database
✅ Requirement 9.5: Image removal from portfolio gallery
✅ Requirement 3.2: Retrieve images by category
✅ Requirement 3.3: Display images from database

All subtasks completed successfully with comprehensive testing coverage.
