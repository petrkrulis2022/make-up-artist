# Images and Contact Form Fix

## What Was Fixed

### 1. Image Storage Issue ✅

**Problem**: Images uploaded through the admin panel were not displaying on the production site.

**Root Cause**: Railway uses ephemeral filesystem, meaning any files stored locally (like uploaded images) are deleted when the service redeploys. The `uploads/` folder was being reset on every deployment.

**Solution**: Created a **Railway Volume** for persistent storage.

- Volume name: `make-up-artist-volume`
- Mount path: `/app/uploads`
- Capacity: 5GB
- Status: Active and attached to the service

**What This Means**:

- All images uploaded through the admin panel will now persist across deployments
- Images are stored in Railway's persistent volume storage
- No more lost images!

### 2. Contact Form Email ✅

**Status**: Email configuration is already set up correctly on Railway with the following variables:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=petrkrulis@gmail.com`
- `SMTP_PASSWORD=********` (configured)
- `SMTP_FROM=petrkrulis@gmail.com`
- `CONTACT_EMAIL=petrkrulis@gmail.com`

The contact form should now work correctly.

## Action Required: Re-upload Images

⚠️ **Important**: All previously uploaded images were lost due to the ephemeral storage issue. You need to re-upload them through the admin panel.

### Steps to Re-upload Images:

1. **Login to Admin Panel**:

   - Go to: https://kaleidoscopic-piroshki-26196f.netlify.app/admin/login
   - Use your admin credentials

2. **Upload Images for Each Category**:

   - Svatební (Wedding makeup)
   - Denní (Daily makeup)
   - Večerní - plesové (Evening/Ball makeup)
   - Účesy (Hairstyles)
   - Obličeje (Face massages)
   - Rukou (Hand massages)
   - O mně (About me)

3. **Verify Images Display**:
   - After uploading, navigate to each portfolio section
   - Confirm images are visible

## Testing Checklist

### Contact Form

- [ ] Visit https://kaleidoscopic-piroshki-26196f.netlify.app/kontakt
- [ ] Fill out the form with:
  - Name: Your name
  - Email: Your email address
  - Message: Test message
- [ ] Submit the form
- [ ] Check for success message
- [ ] Verify email received at petrkrulis@gmail.com

### Image Upload & Display

- [ ] Login to admin panel
- [ ] Upload test image to a category
- [ ] Navigate to that portfolio section
- [ ] Verify image displays correctly
- [ ] Image URL should be: `https://make-up-artist-production.up.railway.app/uploads/[category]/[filename]`

## Technical Details

### Volume Configuration

```bash
# View volume status
cd backend && railway volume list

# Current configuration
Volume: make-up-artist-volume
Attached to: make-up-artist
Mount path: /app/uploads
Storage used: 0MB/5000MB
```

### Environment Variables Updated

```bash
UPLOAD_DIR=/app/uploads  # Points to persistent volume
```

### Image URL Format

- Local development: `http://localhost:3000/uploads/[category]/[filename]`
- Production: `https://make-up-artist-production.up.railway.app/uploads/[category]/[filename]`

## Future Improvements (Optional)

For even better performance and reliability, consider migrating to cloud storage:

1. **Cloudinary** (Recommended)

   - Free tier: 25GB storage, 25GB bandwidth/month
   - Automatic image optimization
   - CDN delivery
   - Image transformations

2. **AWS S3**

   - More control and scalability
   - Pay-as-you-go pricing

3. **Supabase Storage**
   - Integrates well with Postgres
   - Free tier available

Would you like me to set up Cloudinary integration for better image management?

## Support

If you encounter any issues:

1. **Images not displaying after upload**:
   - Check Railway logs: `cd backend && railway logs`
   - Verify volume is attached: `railway volume list`
2. **Contact form not sending**:

   - Check Railway logs for email errors
   - Verify SMTP settings are correct
   - Test with: `railway logs --filter smtp`

3. **Volume storage full**:
   - Check usage: `railway volume list`
   - Current limit: 5GB
   - Can be increased if needed
