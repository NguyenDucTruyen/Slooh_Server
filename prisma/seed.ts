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
    } else {
      const adminPassword = 'Admin123!'; // Change this to a secure password
      const hashedPassword = await encryptPassword(adminPassword);

      const admin = await prisma.nGUOIDUNG.create({
        data: {
          hoTen: 'Administrator',
          email: 'admin@slooh.com',
          matKhau: hashedPassword,
          anhDaiDien: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
          quyen: Quyen.ADMIN,
          trangThai: TrangThai.HOAT_DONG,
          daXacThucEmail: true
        }
      });
      // Create admin user

      console.log('✅ Admin user created successfully:');
      console.log('   Email:', admin.email);
      console.log('   Password:', adminPassword);
      console.log('   Role:', admin.quyen);
      console.log('   Status:', admin.trangThai);
    }

    // Create a demo regular user
    const userPassword = 'User123!';
    const hashedUserPassword = await encryptPassword(userPassword);

    const additionalUsers = [
      { hoTen: 'Đức Truyền', email: 'ductruyen@slooh.com' },
      { hoTen: 'Võ Thị Thùy Dương', email: 'thuyduongvo@slooh.com' },
      { hoTen: 'Nguyễn Văn Vĩnh Định', email: 'nvvdin@slooh.com' },
      { hoTen: 'Alice Nguyễn', email: 'alice.nguyen@slooh.com' },
      { hoTen: 'Nguyễn Văn A', email: 'aanv@slooh.com' },
      { hoTen: 'Travis Nguyễn', email: 'travis.alu@slooh.com' }
    ];

    for (const user of additionalUsers) {
      const randomColor = Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
      await prisma.nGUOIDUNG.create({
        data: {
          hoTen: user.hoTen,
          email: user.email,
          matKhau: hashedUserPassword,
          anhDaiDien: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=${randomColor}&color=fff`,
          quyen: Quyen.NGUOI_DUNG,
          trangThai: TrangThai.HOAT_DONG,
          daXacThucEmail: true
        }
      });
    }

    console.log('✅ Demo user created successfully:');
    console.log('   Password:', userPassword);

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
