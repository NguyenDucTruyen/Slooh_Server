import { PrismaClient, Quyen, TrangThai } from '@prisma/client';
import { config } from 'dotenv';
import { encryptPassword } from '../src/utils/encryption';

// Load environment variables from .env file
config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if admin already exists
    const existingAdmin = await prisma.nGUOIDUNG.findFirst({
      where: { quyen: Quyen.ADMIN }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminPassword = 'Admin123!'; // Change this to a secure password
    const hashedPassword = await encryptPassword(adminPassword);

    const admin = await prisma.nGUOIDUNG.create({
      data: {
        hoTen: 'System Administrator',
        email: 'admin@slooh.com',
        matKhau: hashedPassword,
        anhDaiDien: null,
        quyen: Quyen.ADMIN,
        trangThai: TrangThai.HOAT_DONG,
        daXacThucEmail: true
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', admin.email);
    console.log('   Password:', adminPassword);
    console.log('   Role:', admin.quyen);
    console.log('   Status:', admin.trangThai);

    // Create a demo regular user
    const userPassword = 'User123!';
    const hashedUserPassword = await encryptPassword(userPassword);

    const demoUser = await prisma.nGUOIDUNG.create({
      data: {
        hoTen: 'Demo User',
        email: 'user@slooh.com',
        matKhau: hashedUserPassword,
        anhDaiDien: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
        quyen: Quyen.NGUOI_DUNG,
        trangThai: TrangThai.HOAT_DONG,
        daXacThucEmail: true
      }
    });

    console.log('✅ Demo user created successfully:');
    console.log('   Email:', demoUser.email);
    console.log('   Password:', userPassword);
    console.log('   Role:', demoUser.quyen);
    console.log('   Status:', demoUser.trangThai);

    // Create a locked user for testing
    const lockedUserPassword = 'Locked123!';
    const hashedLockedPassword = await encryptPassword(lockedUserPassword);

    const lockedUser = await prisma.nGUOIDUNG.create({
      data: {
        hoTen: 'Locked User',
        email: 'locked@slooh.com',
        matKhau: hashedLockedPassword,
        anhDaiDien: null,
        quyen: Quyen.NGUOI_DUNG,
        trangThai: TrangThai.KHOA,
        daXacThucEmail: true
      }
    });

    console.log('✅ Locked user created for testing:');
    console.log('   Email:', lockedUser.email);
    console.log('   Password:', lockedUserPassword);
    console.log('   Role:', lockedUser.quyen);
    console.log('   Status:', lockedUser.trangThai);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@slooh.com / Admin123!');
    console.log('   User:  user@slooh.com / User123!');
    console.log('   Locked: locked@slooh.com / Locked123! (Cannot login)');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
