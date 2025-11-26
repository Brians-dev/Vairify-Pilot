# Database Export Guide - Supabase/PostgreSQL

## Quick Export Options

### Option 1: Using Supabase Dashboard (Easiest) ⭐

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run this query to export schema:

```sql
-- Export all table schemas
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
    string_agg(column_name || ' ' || data_type, ', ') || 
    ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY schemaname, tablename;
```

4. Or use **Table Editor** → Select table → **Export** button

---

### Option 2: Using Supabase CLI (Recommended)

#### Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

#### Export Schema Only:
```bash
cd vairify-production-2e0722ea-main
supabase db dump --schema public -f database_schema.sql
```

#### Export Schema + Data:
```bash
supabase db dump --schema public --data-only -f database_data.sql
```

#### Export Everything (Schema + Data):
```bash
supabase db dump -f full_database_export.sql
```

#### Export Specific Tables:
```bash
supabase db dump -t profiles -t vai_verifications -t dateguard_sessions -f specific_tables.sql
```

---

### Option 3: Using pg_dump (PostgreSQL Native)

#### Install PostgreSQL Tools:
```bash
# macOS
brew install postgresql

# Or download from: https://www.postgresql.org/download/
```

#### Get Connection String from Supabase:
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Copy **Connection string** (URI format)

#### Export Schema:
```bash
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  -f database_schema.sql
```

#### Export Data:
```bash
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-acl \
  -f database_data.sql
```

#### Export Everything:
```bash
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  -f full_database_export.sql
```

#### Export Specific Tables:
```bash
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --schema=public \
  --table=profiles \
  --table=vai_verifications \
  --table=dateguard_sessions \
  --no-owner \
  --no-acl \
  -f specific_tables.sql
```

---

### Option 4: Export via SQL Script (No Tools Needed)

Create a SQL script to generate CREATE TABLE statements:

```sql
-- Export all table definitions
SELECT 
    'CREATE TABLE ' || table_name || ' (' || E'\n' ||
    string_agg(
        '  ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'USER-DEFINED' THEN udt_name
            WHEN data_type = 'ARRAY' THEN udt_name || '[]'
            ELSE data_type
        END ||
        CASE WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ',' || E'\n'
        ORDER BY ordinal_position
    ) || E'\n' || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
GROUP BY table_name
ORDER BY table_name;
```

---

### Option 5: Export Data as CSV/JSON

#### Using Supabase Dashboard:
1. Go to **Table Editor**
2. Select table
3. Click **Export** → Choose format (CSV, JSON)

#### Using SQL:
```sql
-- Export as CSV (copy result)
COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER;

-- Export as JSON
SELECT json_agg(row_to_json(t)) 
FROM (SELECT * FROM profiles) t;
```

---

## Your Current Migration Files

You already have migration files that contain your schema:

- `supabase/migrations/20251114180749_remix_migration_from_pg_dump.sql` - Main schema dump
- Plus 24 additional migration files

**To recreate your current database schema, you can:**
1. Use the existing migration files
2. Or create a new dump from current database

---

## Recommended Approach

### For Schema Export:
**Use your existing migration files** - they already contain the complete schema!

### For Data Export:
**Use Supabase Dashboard** → Table Editor → Export (easiest)

### For Full Backup:
**Use Supabase CLI** (once installed):
```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## Quick Commands Reference

```bash
# Export schema only
supabase db dump --schema-only -f schema.sql

# Export data only  
supabase db dump --data-only -f data.sql

# Export specific tables
supabase db dump -t table1 -t table2 -f tables.sql

# Export everything
supabase db dump -f full_backup.sql
```

---

## Environment Variables Needed

If using pg_dump or Supabase CLI, you'll need:

```bash
# From Supabase Dashboard → Settings → Database
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
SUPABASE_DB_PASSWORD="[YOUR_PASSWORD]"
```

---

## Next Steps

1. **Install Supabase CLI** (recommended):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   cd vairify-production-2e0722ea-main
   supabase link --project-ref gotcpbqwilvigxficruc
   ```

4. **Export database**:
   ```bash
   supabase db dump -f database_export.sql
   ```

---

**Note:** Your existing migration file `20251114180749_remix_migration_from_pg_dump.sql` already contains a complete schema dump from a previous export!


