# 🚀 Syllabus Sync - Database Deployment Checklist

## ✅ **COMPLETED: Schema Analysis & API Updates**

All database schema mismatches have been identified and resolved. API routes have been updated for full compatibility.

---

## 📋 **DEPLOYMENT STEPS**

### **Step 1: Database Schema Migration**

#### **Option A: Fresh Database (Recommended for new projects)**

```sql
-- Run the complete corrected schema
-- File: docs/database/database-schema.sql
```

#### **Option B: Migrate Existing Database**

```sql
-- Run migration script in order
-- File: database-migrations.sql

-- 1. Create notifications table
-- 2. Add location column to units
-- 3. Create class_times table
-- 4. Update deadlines structure
-- 5. Update events structure
-- 6. Add indexes for performance
-- 7. Enable RLS (optional)
```

### **Step 2: Data Migration (if existing data)**

```sql
-- Run data migration helpers
-- File: data-migration-helpers.sql

-- Migrate units location data
-- Migrate class_times from units.schedule
-- Update deadlines unit_code and due_date
-- Add sample data for development
```

### **Step 3: Environment Setup**

```bash
# Set up environment variables
cp .env.example .env.local

# Required variables:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your-google-maps-embed-api-key
```

### **Step 4: Deploy Application**

```bash
# Build and deploy
npm run build
npm run start
# OR deploy to Vercel/Netlify/etc.
```

---

## 🔍 **VERIFICATION CHECKLIST**

### **Database Structure**

- [ ] `users` table exists with correct columns
- [ ] `units` table has `location` JSONB column (not `building`/`room`)
- [ ] `class_times` table exists as separate entity
- [ ] `deadlines` table has `unit_code` and `due_date` (not `unit_id`/`due_at`)
- [ ] `events` table has `building` column and correct date/time fields
- [ ] `notifications` table exists with all required columns
- [ ] All foreign key constraints are in place
- [ ] Indexes are created for performance

### **API Endpoints**

- [ ] `GET /api/units` - Returns units with class_times populated
- [ ] `POST /api/units` - Creates unit + class_times
- [ ] `GET /api/deadlines` - Returns all deadlines
- [ ] `POST /api/deadlines` - Creates new deadline
- [ ] `GET /api/events` - Returns all events
- [ ] `POST /api/events` - Creates new event
- [ ] `GET /api/notifications` - Returns all notifications
- [ ] `POST /api/notifications` - Creates new notification
- [ ] `PUT /api/notifications/mark-all-read` - Marks all as read

### **Data Integrity**

- [ ] Existing units data migrated to JSONB location format
- [ ] Class times extracted from units.schedule to separate table
- [ ] Deadlines migrated from unit_id to unit_code references
- [ ] Date fields properly formatted (due_date, event_date)
- [ ] Sample data inserted for development/testing

### **Application Functionality**

- [ ] Home page loads units and schedules correctly
- [ ] Calendar displays deadlines properly
- [ ] Map shows building navigation
- [ ] Events feed displays correctly
- [ ] Notifications system works
- [ ] All CRUD operations functional

### **Security Verification**

- [ ] `middleware.ts` is present in root and correctly configured
- [ ] **Content Security Policy**: Verify `script-src` uses hashes and no `unsafe-inline`
- [ ] **HSTS**: Verify `Strict-Transport-Security` header is set in production
- [ ] **Enumeration**: Verify `/api/auth/signup` returns generic message for existing emails
- [ ] **XSS**: Verify API rejects inputs containing `<` or `>` characters
- [ ] **CSRF**: Verify mutation methods reject requests with invalid `Origin` headers

---

## 🛠️ **TROUBLESHOOTING**

### **Common Issues**

#### **API Returns Empty Arrays**

- Check database connection
- Verify table names and column names match schema
- Check RLS policies if enabled

#### **Date Fields Wrong Format**

- Ensure `due_date` is `timestamp with time zone`
- Verify date parsing in mappers handles both formats

#### **Unit Location Not Working**

- Confirm `location` is JSONB, not separate columns
- Check mapper handles both old and new formats

#### **Class Times Not Loading**

- Verify `class_times` table has data
- Check units API joins correctly
- Confirm day enum values match

### **Rollback Procedures**

If migration fails, use rollback helpers in `data-migration-helpers.sql`

---

## 📁 **FILES CREATED/MODIFIED**

### **New Files**

- `docs/database/database-schema.sql` - Complete corrected schema
- `database-migrations.sql` - Step-by-step migration script
- `data-migration-helpers.sql` - Data migration utilities
- `docs/operations/deployment-checklist.md` - This deployment guide

### **Modified Files**

- `app/api/_lib/mappers.ts` - Updated for schema compatibility
- `app/api/units/route.ts` - Enhanced with class_times integration
- `app/api/notifications/route.ts` - Added POST endpoint
- `app/api/events/route.ts` - Added POST endpoint
- `app/api/notifications/mark-all-read/route.ts` - New endpoint

---

## 🎯 **SUCCESS CRITERIA**

✅ **Database**: Schema matches website expectations perfectly
✅ **APIs**: All endpoints functional with correct data structure
✅ **Data**: Existing data migrated without loss
✅ **Application**: All features work as expected
✅ **Performance**: Indexes created for optimal queries

---

## 🚨 **CRITICAL NOTES**

1. **Backup Database**: Always backup before running migrations
2. **Test Environment**: Test migrations on staging before production
3. **Data Verification**: Verify data integrity after each migration step
4. **API Testing**: Test all CRUD operations after deployment

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check this checklist first
2. Review migration logs for errors
3. Verify environment variables
4. Test API endpoints individually

**All schema compatibility issues have been resolved!** 🎉
