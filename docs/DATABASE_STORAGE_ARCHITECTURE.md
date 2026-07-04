# Database and Storage Architecture Plan

## Executive Summary

**Standard Architecture**: Railway PostgreSQL (databases) + Supabase Storage (files)

This architecture separates concerns: Railway handles structured data with excellent PostgreSQL management, while Supabase Storage handles file uploads with built-in CDN and S3-compatible API.

## Current State Analysis

### Database Status
| Project | Current Database | ORM | Current Status |
|---------|-----------------|-----|----------------|
| Settle | None | None | ✅ Greenfield |
| Reid | Supabase → Railway | Raw `pg` | 🔄 Migration in progress |
| Notyced | Supabase | TypeORM | ⏳ Needs Railway migration |
| Prime | Render | TypeORM | ⏳ Gradual migration planned |

### Storage Status
| Project | Current Storage | Status |
|---------|----------------|--------|
| Settle | None | ✅ Greenfield |
| Reid | Local filesystem | ⏳ Needs Supabase Storage |
| Notyced | Cloudflare R2 | ⏳ Needs Supabase Storage |
| Prime | Local filesystem | ⏳ Needs Supabase Storage |

## Implementation Plan

### Phase 1: Settle (Greenfield - Immediate)
**Timeline**: Week 1
**Effort**: Low

**Database Setup**:
1. Add Railway PostgreSQL service to Settle Railway project
2. Configure TypeORM (following Prime/Notyced pattern)
3. Implement standard User entity schema
4. Set up database migrations
5. Configure `DATABASE_URL` environment variable

**Storage Setup**:
1. Create Supabase project for Settle
2. Configure Supabase Storage buckets
3. Install `@supabase/supabase-js` client using pnpm
4. Implement file upload endpoints
5. Add storage configuration to shared SDK

**Benefits**:
- Clean implementation from scratch
- Sets the standard for other projects
- No migration complexity

### Phase 2: Reid (Migration - Week 2)
**Timeline**: Week 2
**Effort**: Medium

**Database Migration**:
1. ✅ Migration scripts already created
2. Create Railway PostgreSQL service
3. Run migration scripts to transfer data
4. Update `DATABASE_URL` to Railway
5. Remove Supabase database dependencies
6. Test all database operations

**Storage Migration**:
1. Create Supabase Storage buckets
2. Migrate existing local files to Supabase Storage
3. Update upload endpoints to use Supabase Storage
4. Remove local filesystem storage
5. Update file serving logic

**Benefits**:
- Migration scripts already ready
- Can test with small dataset first
- Rollback plan available

### Phase 3: Notyced (Migration - Week 3)
**Timeline**: Week 3
**Effort**: Medium-High

**Database Migration**:
1. Export data from Supabase PostgreSQL
2. Create Railway PostgreSQL service
3. Import data to Railway PostgreSQL
4. Update TypeORM configuration for Railway
5. Update `DATABASE_URL` environment variable
6. Remove Supabase database connection
7. Test all TypeORM operations

**Storage Migration**:
1. Export data from Cloudflare R2
2. Create Supabase Storage buckets
3. Import data to Supabase Storage
4. Replace R2 client with Supabase Storage client
5. Update upload/download endpoints
6. Remove R2 dependencies

**Benefits**:
- TypeORM already configured (just change connection)
- Standard storage across all projects
- Remove Cloudflare dependency

### Phase 4: Prime (Gradual - Week 4-6)
**Timeline**: Week 4-6
**Effort**: High

**Database Migration**:
1. Create comprehensive backup of Render PostgreSQL
2. Set up Railway PostgreSQL service
3. Migrate schema and data
4. Update TypeORM configuration
5. Test all complex queries and relationships
6. Update Redis configuration for Railway
7. Gradual traffic migration (canary deployment)
8. Monitor performance and rollback if needed

**Storage Migration**:
1. Audit all file upload endpoints
2. Create Supabase Storage buckets
3. Implement parallel storage (write to both local and Supabase)
4. Migrate existing files to Supabase Storage
5. Update all upload endpoints to Supabase Storage
6. Remove local filesystem storage
7. Update mobile app upload logic

**Benefits**:
- Gradual migration reduces risk
- Can test with subset of users first
- Prime is most complex, deserves careful approach

## Standard Configuration Patterns

### Railway PostgreSQL Configuration

**Environment Variables**:
```bash
# Railway auto-injects DATABASE_URL when PostgreSQL service is added
DATABASE_URL=postgresql://user:password@host.railway.app:5432/database
```

**TypeORM Configuration** (Standard Pattern):
```typescript
// src/data-source.ts
export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') 
    ? { rejectUnauthorized: false }
    : false,
  entities: [User, /* other entities */],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
```

**Railway.toml** (Standard Pattern):
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd project-api && pnpm install && pnpm run build"

[deploy]
startCommand = "cd project-api && pnpm start"
healthcheckPath = "/health"

# DATABASE_URL auto-injected when PostgreSQL service is added
```

### Supabase Storage Configuration

**Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Supabase Client** (Standard Pattern):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Storage operations
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/to/file', file);
```

**Buckets Structure** (Standard Pattern):
```
project-storage/
├── avatars/          # User profile pictures
├── documents/        # User documents
├── media/           # General media files
└── temp/           # Temporary uploads
```

## Shared SDK Storage Integration

### Update @settle/shared-sdk

**Add Storage Module**:
```typescript
// packages/shared-sdk/src/storage/index.ts
import { createClient } from '@supabase/supabase-js';

export interface StorageConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucket: string;
}

export function createStorageClient(config: StorageConfig) {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  return {
    upload: async (path: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(path, file);
      
      if (error) throw error;
      return data;
    },
    
    getPublicUrl: (path: string) => {
      const { data } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(path);
      return data.publicUrl;
    },
    
    delete: async (path: string) => {
      const { error } = await supabase.storage
        .from(config.bucket)
        .remove([path]);
      if (error) throw error;
    }
  };
}
```

## Migration Scripts

### Database Migration Script Template

```typescript
// scripts/migrate-database.ts
import { Client } from 'pg';

async function migrateDatabase() {
  const sourceClient = new Client({ connectionString: process.env.SOURCE_DATABASE_URL });
  const targetClient = new Client({ connectionString: process.env.TARGET_DATABASE_URL });

  try {
    await sourceClient.connect();
    await targetClient.connect();

    // Migrate each table
    const tables = ['users', 'projects', /* other tables */];
    
    for (const table of tables) {
      console.log(`Migrating ${table}...`);
      
      const { rows } = await sourceClient.query(`SELECT * FROM ${table}`);
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        await targetClient.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
      
      console.log(`Migrated ${rows.length} rows from ${table}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

migrateDatabase();
```

### Storage Migration Script Template

```typescript
// scripts/migrate-storage.ts
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function migrateStorage() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const localDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
  const bucket = process.env.SUPABASE_BUCKET || 'project-storage';

  try {
    const files = await readdir(localDir);
    
    for (const file of files) {
      const filePath = join(localDir, file);
      const fileBuffer = await readFile(filePath);
      
      console.log(`Uploading ${file}...`);
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(file, fileBuffer);
      
      if (error) {
        console.error(`Failed to upload ${file}:`, error);
      } else {
        console.log(`Successfully uploaded ${file}`);
      }
    }
    
    console.log('Storage migration completed');
  } catch (error) {
    console.error('Storage migration failed:', error);
    throw error;
  }
}

migrateStorage();
```

## Cost Analysis

### Railway PostgreSQL Costs
- **Free Tier**: $5/month credit (includes 1x PostgreSQL)
- **Starter**: $5/month for additional services
- **Standard**: $20/month for production

### Supabase Storage Costs
- **Free Tier**: 1GB storage, 2GB bandwidth/month
- **Pro**: $25/month for 100GB storage, 200GB bandwidth
- **Enterprise**: Custom pricing

### Total Estimated Monthly Costs
- **Development**: $0 (Railway free tier + Supabase free tier)
- **Production**: $45-70/month (Railway Standard + Supabase Pro)

## Benefits of This Architecture

### 1. **Separation of Concerns**
- Railway: Optimized for PostgreSQL, connection pooling, backups
- Supabase Storage: Optimized for file storage, CDN, S3-compatible API

### 2. **Cost Efficiency**
- Railway: Excellent value for PostgreSQL
- Supabase Storage: Competitive pricing with built-in CDN

### 3. **Developer Experience**
- Railway: Easy database management, automatic backups
- Supabase Storage: Simple API, built-in image optimization

### 4. **Scalability**
- Railway: Easy vertical scaling, read replicas
- Supabase Storage: Automatic CDN, global edge network

### 5. **Consistency**
- All projects use same database/storage stack
- Shared knowledge and tooling
- Easier cross-project maintenance

## Risk Mitigation

### Database Migration Risks
- **Data Loss**: Implement comprehensive backups before migration
- **Downtime**: Use canary deployments for gradual migration
- **Performance**: Monitor query performance during migration
- **Rollback**: Keep old database running until migration verified

### Storage Migration Risks
- **File Loss**: Verify all files migrated before deletion
- **Broken Links**: Update all file references in database
- **Performance**: Test file upload/download speeds
- **Cost**: Monitor storage usage and bandwidth

## Success Criteria

### Database Migration Success
- [ ] All data migrated without loss
- [ ] All database operations working correctly
- [ ] Performance equal or better than before
- [ ] No data corruption
- [ ] Backup and restore tested

### Storage Migration Success
- [ ] All files migrated without loss
- [ ] All upload/download endpoints working
- [ ] File serving performance acceptable
- [ ] CDN working correctly
- [ ] Storage costs within budget

## Timeline Summary

| Week | Project | Focus |
|------|---------|-------|
| 1 | Settle | Railway PostgreSQL + Supabase Storage setup |
| 2 | Reid | Complete database migration + storage setup |
| 3 | Notyced | Database migration + storage migration |
| 4-6 | Prime | Gradual database + storage migration |

## Next Steps

1. **Immediate**: Start Settle implementation (greenfield)
2. **Week 2**: Execute Reid migration (scripts ready)
3. **Week 3**: Plan Notyced migration in detail
4. **Week 4**: Begin Prime migration planning
5. **Ongoing**: Monitor and optimize all migrations