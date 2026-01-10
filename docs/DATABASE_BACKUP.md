# Database Backup & Restore Procedures

This document outlines the backup and restore procedures for the Syllabus Sync Supabase database.

## Table of Contents

- [Overview](#overview)
- [Backup Methods](#backup-methods)
- [Restore Procedures](#restore-procedures)
- [Automated Backups](#automated-backups)
- [Best Practices](#best-practices)
- [Disaster Recovery](#disaster-recovery)

## Overview

Syllabus Sync uses **Supabase** (PostgreSQL) as its database. Supabase provides several backup options depending on your plan:

| Plan       | Backup Type            | Frequency  | Retention |
| ---------- | ---------------------- | ---------- | --------- |
| Free       | None (manual only)     | N/A        | N/A       |
| Pro        | Point-in-Time Recovery | Continuous | 7 days    |
| Team       | Point-in-Time Recovery | Continuous | 14 days   |
| Enterprise | Point-in-Time Recovery | Continuous | Custom    |

## Backup Methods

### 1. Supabase Dashboard (Recommended for Pro+)

For Pro plans and above, use the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Under **Backups**, view available backups
5. Click **Download** to export a backup

### 2. Manual SQL Dump (All Plans)

Use `pg_dump` for manual backups:

```bash
# Set your database connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Full database backup
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only (no data)
pg_dump --schema-only "$DATABASE_URL" > schema_backup.sql

# Data only (no schema)
pg_dump --data-only "$DATABASE_URL" > data_backup.sql

# Specific tables only
pg_dump "$DATABASE_URL" \
  --table=public.units \
  --table=public.deadlines \
  --table=public.events \
  --table=public.notifications \
  --table=public.gamification \
  > tables_backup.sql
```

### 3. Supabase CLI Backup

Using the Supabase CLI:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Dump the database
supabase db dump -f backup.sql

# Dump with data
supabase db dump -f backup.sql --data-only

# Dump specific schema
supabase db dump -f backup.sql --schema public
```

### 4. Export via Supabase API

For programmatic backups:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function exportTable(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) throw error;

  // Save to JSON file
  const fs = require('fs');
  fs.writeFileSync(`${tableName}_${Date.now()}.json`, JSON.stringify(data, null, 2));

  return data;
}

// Export all tables
async function fullExport() {
  const tables = ['units', 'deadlines', 'events', 'notifications', 'gamification'];
  for (const table of tables) {
    await exportTable(table);
    console.log(`Exported ${table}`);
  }
}
```

## Restore Procedures

### 1. Point-in-Time Recovery (Pro+ Plans)

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Click **Restore** under Backups
3. Select the timestamp to restore to
4. Confirm the restore operation

**Warning**: This will overwrite your current database!

### 2. Restore from SQL Dump

```bash
# Set your database connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Full restore (drops existing data!)
psql "$DATABASE_URL" < backup.sql

# Restore with transaction (rollback on error)
psql "$DATABASE_URL" --single-transaction < backup.sql

# Restore specific tables
psql "$DATABASE_URL" < tables_backup.sql
```

### 3. Restore via Supabase CLI

```bash
# Restore from dump file
supabase db push --db-url "$DATABASE_URL" < backup.sql
```

### 4. Restore from JSON Export

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function restoreTable(tableName: string, filePath: string) {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Clear existing data (optional)
  await supabase.from(tableName).delete().neq('id', '');

  // Insert backup data
  const { error } = await supabase.from(tableName).insert(data);

  if (error) throw error;
  console.log(`Restored ${data.length} rows to ${tableName}`);
}
```

## Automated Backups

### GitHub Actions Backup Schedule

Create `.github/workflows/db-backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - run: |
          aws s3 cp backup_*.sql s3://your-backup-bucket/syllabus-sync/

      - name: Cleanup old backups (keep 30 days)
        run: |
          aws s3 ls s3://your-backup-bucket/syllabus-sync/ | \
          awk '{print $4}' | \
          head -n -30 | \
          xargs -I {} aws s3 rm s3://your-backup-bucket/syllabus-sync/{}
```

### Local Cron Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"
echo "Backup created: backup_$DATE.sql.gz"

# Remove old backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
```

## Best Practices

### Before Backup

1. **Notify users** of potential slowdown during large backups
2. **Check disk space** on target storage
3. **Verify credentials** are valid and have necessary permissions

### During Backup

1. **Monitor progress** for large databases
2. **Avoid schema changes** during backup
3. **Log backup operations** for audit trail

### After Backup

1. **Verify backup integrity**:

   ```bash
   # Check SQL file is valid
   psql --file=backup.sql --echo-errors -d postgres -c "SELECT 1" 2>/dev/null
   ```

2. **Test restore** periodically in a staging environment

3. **Store backups securely**:
   - Encrypt sensitive backups
   - Use multiple storage locations (3-2-1 rule)
   - Restrict access to backup files

### Backup Checklist

- [ ] Backup includes all tables (units, deadlines, events, notifications, gamification)
- [ ] Backup includes RLS policies and functions
- [ ] Backup is stored in at least 2 locations
- [ ] Restore procedure has been tested in last 30 days
- [ ] Backup encryption is enabled for production data
- [ ] Retention policy is documented and followed

## Disaster Recovery

### Recovery Time Objectives

| Scenario        | RTO Target | RPO Target |
| --------------- | ---------- | ---------- |
| Minor data loss | < 1 hour   | < 24 hours |
| Major outage    | < 4 hours  | < 1 hour   |
| Full disaster   | < 24 hours | < 24 hours |

### Recovery Steps

1. **Assess the situation**
   - Identify what data was lost
   - Determine the timestamp of last known good state

2. **Restore from backup**
   - Choose appropriate backup source
   - Restore to staging first if possible
   - Verify data integrity

3. **Validate restoration**
   - Run health checks on restored data
   - Test critical functionality
   - Verify user data accuracy

4. **Post-recovery**
   - Document incident
   - Update backup procedures if needed
   - Communicate with affected users

### Emergency Contacts

| Role             | Contact             |
| ---------------- | ------------------- |
| Supabase Support | support@supabase.io |
| Database Admin   | [Your DBA contact]  |
| Project Lead     | [Your lead contact] |

## Tables Reference

The following tables should be included in all backups:

| Table                | Description            | Priority |
| -------------------- | ---------------------- | -------- |
| `profiles`           | User profiles          | Critical |
| `units`              | Academic units/courses | Critical |
| `deadlines`          | Assignment deadlines   | Critical |
| `events`             | Schedule events        | High     |
| `notifications`      | User notifications     | Medium   |
| `gamification`       | XP and achievements    | Medium   |
| `building_positions` | Map data               | Low      |

## Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
