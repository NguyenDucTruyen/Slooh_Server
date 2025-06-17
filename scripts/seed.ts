#!/usr/bin/env ts-node

/**
 * Quick Admin Setup Script
 * This script creates an admin user if one doesn't exist
 * Run: yarn db:seed or npm run db:seed
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Import and run the main seed function
import('./seed')
  .then(() => {
    console.log('\n🚀 You can now login with the admin credentials!');
    console.log('💡 Remember to change the default passwords in production!');
  })
  .catch((error) => {
    console.error('Failed to run seed:', error);
    process.exit(1);
  });
