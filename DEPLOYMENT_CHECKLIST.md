# Vetted Deployment Checklist

## Pre-Deployment Requirements (Must Complete Before Production)

### 🔴 Critical - Block Production Deployment

#### Infrastructure
- [ ] **File Storage**: Migrate from local storage to cloud (S3/Cloudinary)
  - [ ] Set up cloud storage account
  - [ ] Create upload utility (`lib/storage.ts`)
  - [ ] Update resume upload endpoint
  - [ ] Test file uploads
  - [ ] Migration script for existing files

- [ ] **API Key Authentication**: Secure extension integration
  - [ ] Add `ApiKey` model to database schema
  - [ ] Create API key generation endpoint
  - [ ] Update candidate upload endpoint
  - [ ] Admin UI for key management
  - [ ] Update extension documentation

- [ ] **Error Tracking**: Set up monitoring
  - [ ] Integrate Sentry (or similar)
  - [ ] Configure error alerts
  - [ ] Test error reporting

- [ ] **Rate Limiting**: Prevent abuse
  - [ ] Implement rate limiting middleware
  - [ ] Configure limits per endpoint
  - [ ] Test rate limiting behavior

- [ ] **Database Migrations**: Automated deployment
  - [ ] Set up migration script in Railway
  - [ ] Test migration process
  - [ ] Document rollback procedure

#### Security
- [ ] **Environment Variables**: Validate all required vars
  - [ ] `DATABASE_URL` - PostgreSQL connection
  - [ ] `AUTH_SECRET` - NextAuth secret
  - [ ] `AUTH_URL` - Production domain
  - [ ] `OPENAI_API_KEY` - For AI features (optional but recommended)
  - [ ] `SERPAPI_KEY` - For job scraper (optional)
  - [ ] Create `.env.example` file

- [ ] **CORS Configuration**: Secure cross-origin requests
  - [ ] Configure allowed origins
  - [ ] Test extension integration

- [ ] **Input Validation**: Ensure all endpoints validate input
  - [ ] Review all API routes
  - [ ] Add Zod schemas where missing
  - [ ] Test malicious inputs

#### Database
- [ ] **Indexes**: Optimize queries
  - [ ] Review slow queries
  - [ ] Add missing indexes
  - [ ] Test query performance

- [ ] **Backups**: Set up automated backups
  - [ ] Configure Railway backups (or external)
  - [ ] Test restore process
  - [ ] Document backup schedule

### 🟡 High Priority - Should Complete Soon

#### Real-time Features
- [ ] **WebSockets**: Replace polling
  - [ ] Choose solution (Socket.io recommended)
  - [ ] Implement WebSocket server
  - [ ] Update messaging endpoints
  - [ ] Update frontend components

- [ ] **Email Notifications**: User engagement
  - [ ] Set up email service (Resend/SendGrid)
  - [ ] Create email templates
  - [ ] Implement notification sending
  - [ ] Test email delivery

#### Search
- [ ] **Full-Text Search**: Improve discovery
  - [ ] Evaluate solutions (PostgreSQL full-text vs Algolia)
  - [ ] Implement chosen solution
  - [ ] Index existing content
  - [ ] Update search UI

### 🟢 Medium Priority - Can Deploy Without

#### User Experience
- [ ] **Feed Algorithm**: Better content ranking
- [ ] **Mobile Optimization**: Responsive improvements
- [ ] **PWA**: Offline support
- [ ] **Push Notifications**: Web push API

#### Features
- [ ] **Bulk Operations**: Candidate management
- [ ] **Export Functionality**: CSV/JSON export
- [ ] **Advanced Filters**: More search options

---

## Deployment Steps

### Step 1: Pre-Deployment Setup

1. **Environment Configuration**
   ```bash
   # Verify all environment variables are set in Railway
   - DATABASE_URL
   - AUTH_SECRET
   - AUTH_URL
   - OPENAI_API_KEY (optional)
   - SERPAPI_KEY (optional)
   ```

2. **Database Setup**
   ```bash
   # Run migrations
   railway run npm run db:push
   
   # Verify schema
   railway run npx prisma studio
   ```

3. **Build Verification**
   ```bash
   # Test build locally
   npm run build
   npm start
   ```

### Step 2: Deploy to Railway

1. **Connect Repository**
   - Link GitHub repo to Railway
   - Configure build settings
   - Set deploy command: `npm run build && npm start`

2. **Configure Services**
   - PostgreSQL service
   - Next.js app service
   - Link services (DATABASE_URL)

3. **Set Environment Variables**
   - Add all required variables
   - Verify AUTH_URL matches Railway domain

4. **Deploy**
   - Trigger deployment
   - Monitor build logs
   - Check for errors

### Step 3: Post-Deployment Verification

1. **Health Checks**
   ```bash
   # Test health endpoint
   curl https://your-domain.railway.app/api/health
   
   # Test authentication
   curl https://your-domain.railway.app/api/auth/signin
   ```

2. **Functionality Tests**
   - [ ] User signup/login works
   - [ ] Feed loads correctly
   - [ ] Job listings display
   - [ ] Candidate upload works (admin)
   - [ ] Extension integration works

3. **Performance Checks**
   - [ ] Page load times < 2s
   - [ ] API response times < 500ms
   - [ ] No memory leaks
   - [ ] Database queries optimized

4. **Monitoring Setup**
   - [ ] Sentry errors visible
   - [ ] Logs accessible
   - [ ] Alerts configured
   - [ ] Uptime monitoring active

---

## Rollback Procedure

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # In Railway dashboard
   - Go to Deployments
   - Find last successful deployment
   - Click "Redeploy"
   ```

2. **Database Rollback** (if schema changes)
   ```bash
   # Revert migration
   railway run npx prisma migrate resolve --rolled-back <migration_name>
   ```

3. **Verify Rollback**
   - Check application is running
   - Verify database schema
   - Test critical features

---

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor error rates (should be < 1%)
- [ ] Check response times
- [ ] Review user signups
- [ ] Monitor database performance
- [ ] Check extension integration

### First Week
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Fix critical bugs
- [ ] Update documentation

### Ongoing
- [ ] Weekly performance review
- [ ] Monthly security audit
- [ ] Quarterly feature planning
- [ ] Regular backups verification

---

## Quick Reference: Environment Variables

### Required
```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_URL=https://your-domain.railway.app
```

### Optional but Recommended
```bash
OPENAI_API_KEY=sk-...          # For AI features
SERPAPI_KEY=...                # For job scraper
GOOGLE_CLIENT_ID=...           # For Google OAuth
GOOGLE_CLIENT_SECRET=...
VETTED_API_KEY=...             # For extension (after implementation)
```

### For File Storage (after migration)
```bash
AWS_ACCESS_KEY_ID=...          # If using S3
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
# OR
CLOUDINARY_URL=cloudinary://... # If using Cloudinary
```

### For Email Notifications (after implementation)
```bash
RESEND_API_KEY=...             # If using Resend
# OR
SENDGRID_API_KEY=...           # If using SendGrid
```

---

## Testing Checklist

### Manual Testing
- [ ] User registration
- [ ] User login (email + Google)
- [ ] Profile creation/editing
- [ ] Connection requests
- [ ] Post creation
- [ ] Job application
- [ ] Candidate upload (admin)
- [ ] Extension integration
- [ ] Search functionality
- [ ] Messaging

### Automated Testing
- [ ] Unit tests pass: `npm run test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`

### Performance Testing
- [ ] Load test API endpoints
- [ ] Test with 100+ concurrent users
- [ ] Database query performance
- [ ] File upload performance

---

## Support & Documentation

### Documentation Needed
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Extension setup guide
- [ ] Admin user guide
- [ ] Troubleshooting guide

### Support Channels
- [ ] Error reporting system
- [ ] User feedback mechanism
- [ ] Support email/chat
- [ ] Knowledge base

---

**Last Updated**: [Current Date]
**Next Review**: After each deployment

