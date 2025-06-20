import { PrismaClient, Quyen, TrangThai } from '@prisma/client';
import { config } from 'dotenv';
import { encryptPassword } from '../src/utils/encryption';

// Load environment variables
config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.nGUOIDUNG.findFirst({
      where: {
        OR: [{ quyen: Quyen.ADMIN }, { email: 'admin@slooh.com' }]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👑 Role:', existingAdmin.quyen);
      console.log('🔒 Status:', existingAdmin.trangThai);
      return;
    }

    // Create the admin user
    const adminEmail = 'admin@slooh.com';
    const adminPassword = '123456Aa'; // You should change this!
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

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🎯 Login Credentials:');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👑 Role:', admin.quyen);
    console.log('🟢 Status:', admin.trangThai);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser().catch((error) => {
  console.error('Failed to create admin user:', error);
  process.exit(1);
});
