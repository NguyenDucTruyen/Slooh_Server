# Database Seeding

This directory contains scripts to seed your database with initial data.

## Quick Start - Create Admin User

To quickly create an admin user for your application:

```bash
# Using yarn
yarn create-admin

# Using npm
npm run create-admin
```

This will create an admin user with the following credentials:
- **Email**: `admin@slooh.com`
- **Password**: `Admin123!`
- **Role**: `ADMIN`
- **Status**: `HOAT_DONG` (Active)

## Full Database Seeding

To seed the database with sample data (admin + demo users):

```bash
# Using yarn
yarn db:seed

# Using npm
npm run db:seed
```

This creates:
1. **Admin User**:
   - Email: `admin@slooh.com`
   - Password: `Admin123!`
   - Role: Admin

2. **Demo User**:
   - Email: `user@slooh.com`
   - Password: `User123!`
   - Role: Regular User

3. **Locked User** (for testing):
   - Email: `locked@slooh.com`
   - Password: `Locked123!`
   - Status: Locked (cannot login)

## Using Prisma Migrate with Seeding

You can also run seeding automatically after migrations:

```bash
# Reset database and run seeds
yarn db:reset

# This will prompt you to confirm, then:
# 1. Drop the database
# 2. Recreate it
# 3. Run migrations
# 4. Run the seed script
```

## Security Notes

⚠️ **Important**: 
- Change default passwords immediately after first login
- Use strong passwords in production
- Consider using environment variables for seed data in production

## Files

- `seed.ts` - Main seed script with sample data
- `../scripts/create-admin.ts` - Quick admin creation script
- `../scripts/seed.ts` - Wrapper script for the main seed

## Customization

To customize the seed data, edit `seed.ts` and modify:
- User credentials
- User roles
- Profile information
- Additional seed data as needed
