import { PrismaClient, Quyen, TrangThai } from '@prisma/client';
import { config } from 'dotenv';
import { encryptPassword } from '../src/utils/encryption';

// Load environment variables from .env file
config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    const existingAdmin = await prisma.nGUOIDUNG.findFirst({
      where: { quyen: Quyen.ADMIN }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
    } else {
      const adminPassword = '123456Aa'; // Change this to a secure password
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
      console.log('✅ Admin user created successfully:');
    }

    // Create a demo regular user
    const userPassword = '123456Aa';
    const hashedUserPassword = await encryptPassword(userPassword);

    const additionalUsers = [
      { hoTen: 'Nguyễn Đức Truyền', email: 'ductruyen@slooh.com' },
      { hoTen: 'Võ Thị Thùy Dương', email: 'thuyduongvo@slooh.com' },
      { hoTen: 'Nguyễn Văn Vĩnh Định', email: 'nvvdin@slooh.com' },
      { hoTen: 'Alice Nguyễn', email: 'alice.nguyen@slooh.com' },
      { hoTen: 'Nguyễn Văn An', email: 'aanv@slooh.com' },
      { hoTen: 'Travis Đặng', email: 'travis.alu@slooh.com' }
    ];

    for (const user of additionalUsers) {
      const existingUser = await prisma.nGUOIDUNG.findUnique({
        where: { email: user.email }
      });

      if (existingUser) {
        console.log(`👤 User already exists: ${user.email}`);
        continue;
      }

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
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create a locked user for testing
    const lockedUserPassword = '123456Aa';
    const hashedLockedPassword = await encryptPassword(lockedUserPassword);

    const existingLockedUser = await prisma.nGUOIDUNG.findUnique({
      where: { email: 'locked@slooh.com' }
    });

    if (existingLockedUser) {
      console.log('👤 Locked user already exists:', existingLockedUser.email);
    } else {
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
      console.log('✅ Locked user created successfully:', lockedUser.email);
    }

    // Find the user with email ductruyen@slooh.com to create their public room
    const ducTruyenUser = await prisma.nGUOIDUNG.findUnique({
      where: { email: 'ductruyen@slooh.com' }
    });

    if (!ducTruyenUser) {
      throw new Error('User ductruyen@slooh.com not found');
    }

    // Create public room "Giới thiệu về Slooh" for ductruyen@slooh.com
    const publicRoom = await prisma.pHONG.create({
      data: {
        tenPhong: 'Giới thiệu về Slooh',
        hoatDong: 'OFFLINE',
        trangThai: 'HOAT_DONG',
        maNguoiTao: ducTruyenUser.maNguoiDung,
        trangs: {
          create: [
            // Page 1: Introduction
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 1,
              tieuDe: '<b>🎉 Giới thiệu Slooh</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750959599/Slooh/saslgnhaqgmbsg0ijp5s.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'CO_BAN',
              noiDung:
                '<b>Slooh </b>là nền tảng trình chiếu kết hợp trò chơi hỏi đáp trực tiếp theo thời gian thực, giúp bạn tạo các buổi trình bày sinh động, có sự tương tác giữa người dẫn và người tham gia.\n<div>✔️ Thay thế PowerPoint truyền thống\n</div><div>✔️ Tăng sự gắn kết và phản hồi từ người nghe\n</div><div>✔️ Phù hợp cho dạy học, hội thảo, workshop, teambuilding</div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 2: Question 1
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 2,
              tieuDe: 'Slooh được sử dụng cho mục đích gì?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110013/Slooh/ep2qpuuobcblrr7qu4op.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650789/Slooh-theme/theme-winter_qqva2u.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Giảng dạy', ketQua: true },
                  { noiDung: 'Thuyết trình', ketQua: true },
                  { noiDung: 'Tổ chức sự kiện', ketQua: true },
                  { noiDung: 'Chơi game cá nhân', ketQua: false }
                ]
              }
            },
            // Page 3: Mission content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 3,
              tieuDe: '💡 Sứ mệnh của Slooh',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110245/Slooh/hgwcblkb8svz0snjcqjc.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650789/Slooh-theme/theme-winter_qqva2u.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'CO_BAN',
              noiDung:
                '* Nâng cao hiệu quả giao tiếp trong thuyết trình\n<div>* Kết nối đa chiều giữa người trình bày và người tham gia\n</div><div>* Mang lại trải nghiệm học tập và làm việc thú vị, hấp dẫn hơn\n</div><div>* Thay đổi cách chúng ta truyền đạt ý tưởng bằng công nghệ tương tác thời gian thực</div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 4: Question 2
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 4,
              tieuDe: 'Sứ mệnh của Slooh tập trung vào điều gì?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110245/Slooh/hgwcblkb8svz0snjcqjc.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650789/Slooh-theme/theme-winter_qqva2u.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Trải nghiệm người dùng', ketQua: true },
                  { noiDung: 'Tính năng kỹ thuật', ketQua: false },
                  { noiDung: 'Khả năng mở rộng', ketQua: false },
                  { noiDung: 'Giá cả cạnh tranh', ketQua: false }
                ]
              }
            },
            // Page 5: Features content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 5,
              tieuDe: '✨ Tính năng nổi bật',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650789/Slooh-theme/theme-winter_qqva2u.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: 'CO_BAN_TEXT',
              noiDung:
                '📊Tạo slide trình chiếu** với nội dung văn bản, hình ảnh, video\n<div>❓ Thêm câu hỏi trắc nghiệm** vào giữa slide\n</div><div>🧑‍💻 Trình chiếu thời gian thực**, điều khiển từ xa\n</div><div>📥 Tham gia bằng mã PIN**, không cần tài khoản\n</div><div>🏆 Chấm điểm – Xếp hạng trực tiếp**\n</div><div>🧠 Báo cáo thống kê kết quả**, lưu lịch sử phòng</div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 6: Question 3
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 6,
              tieuDe: 'Tính năng nào <b>KHÔNG</b> phải là tính năng nổi bật của Slooh?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110013/Slooh/ep2qpuuobcblrr7qu4op.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650786/Slooh-theme/theme-autumn_mot9cw.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Trình chiếu ngoại tuyến', ketQua: true },
                  { noiDung: 'Câu hỏi trắc nghiệm tương tác', ketQua: false },
                  { noiDung: 'Bảng xếp hạng', ketQua: false },
                  { noiDung: 'Mã PIN tham gia', ketQua: false }
                ]
              }
            },
            // Page 7: Who can use content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 7,
              tieuDe: '👥 AI có thể sử dụng Slooh ?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112474/Slooh/tdgoifrgacwdrjebmnqk.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650786/Slooh-theme/theme-autumn_mot9cw.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'HAI_COT',
              noiDung:
                '👨‍🏫 Giáo viên: Dạy học tương tác\r<div>👩‍💼 Nhân sự: Đào tạo nội bộ, onboarding\r</div><div>🧑‍💻 Diễn giả: Workshop, hội thảo\r</div><div>🧠 Học sinh – sinh viên: Thuyết trình nhóm\r</div><div>🎉 Tổ chức game show – hoạt động tập thể</div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 8: Question 4
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 8,
              tieuDe: 'Ai <b>KHÔNG </b>thể sử dụng Slooh?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112474/Slooh/tdgoifrgacwdrjebmnqk.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Người dùng cá nhân', ketQua: false },
                  { noiDung: 'Giáo viên', ketQua: false },
                  { noiDung: 'Người tổ chức sự kiện', ketQua: false },
                  { noiDung: 'Hệ thống quản lý nội bộ không cho phép kết nối mạng', ketQua: true }
                ]
              }
            },
            // Page 9: How it works content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 9,
              tieuDe: '<b>⚙️ Cách hoạt động của Slooh</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112635/Slooh/a2dofwdz87aroyjrfrzm.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung:
                '1. Tạo phòng;<div>2. Tạo slide + câu hỏi;</div><div>3. Người tham gia dùng mã PIN;&nbsp;</div><div><span style="font-size: 1.25rem; color: rgb(2, 8, 23);">4. Trình chiếu + trả lời câu hỏi; 5. Hiển thị kết quả &amp; bảng xếp hạng</span></div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 10: Question 5
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 10,
              tieuDe: '<b>Thứ tự hoạt động của Slooh là gì?</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112635/Slooh/a2dofwdz87aroyjrfrzm.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  {
                    noiDung:
                      'Tạo phòng, tạo slide, người tham gia dùng mã PIN, trình chiếu, hiển thị kết quả',
                    ketQua: true
                  },
                  {
                    noiDung:
                      'Tạo slide, tạo phòng, người tham gia dùng mã PIN, trình chiếu, hiển thị kết quả',
                    ketQua: false
                  },
                  {
                    noiDung:
                      'Người tham gia dùng mã PIN, tạo phòng, tạo slide, trình chiếu, hiển thị kết quả',
                    ketQua: false
                  }
                ]
              }
            },
            // Page 11: Interface content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 11,
              tieuDe: '<b>🖥️ Giao diện và trải nghiệm</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112680/Slooh/v5sjmdobopn1unko9ahz.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825615/Theme-bg/theme-basketball_haxpme.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung:
                'Giao diện tối giản, hiện đại<div>Preview nội dung từng trang\n</div><div>Người dùng dễ thao tác ngay lần đầu\n</div><div>Hỗ trợ mọi thiết bị: PC, tablet, mobile</div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 12: Question 6
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 12,
              tieuDe: '<b>Điều nào mô tả chính xác giao diện Slooh?</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751112680/Slooh/v5sjmdobopn1unko9ahz.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650788/Slooh-theme/theme-summer_iylowb.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Đơn giản, thân thiện và dễ sử dụng', ketQua: true },
                  { noiDung: 'Chỉ hoạt động trên máy tính', ketQua: false },
                  { noiDung: 'Không có hỗ trợ xem trước', ketQua: false },
                  { noiDung: 'Phức tạp và khó sử dụng', ketQua: false }
                ]
              }
            }
          ]
        }
      }
    });

    console.log('✅ Public room "Giới thiệu về Slooh" created successfully');

    // Create second public room "Giới thiệu chung về CNTT"
    const itIntroRoom = await prisma.pHONG.create({
      data: {
        tenPhong: 'Giới thiệu chung về CNTT',
        hoatDong: 'OFFLINE',
        trangThai: 'HOAT_DONG',
        maNguoiTao: ducTruyenUser.maNguoiDung,
        trangs: {
          create: [
            // Page 1: Basic concepts
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 1,
              tieuDe: 'Khái niệm cơ bản về Tin học và CNTT',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751117244/Slooh/nltiluqj9ptzumjmnhi8.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Tin học là ngành khoa học nghiên cứu về máy tính và xử lý thông tin. Công nghệ thông tin (IT) hoặc Công nghệ thông tin và truyền thông (ICT) sử dụng máy tính và hệ thống truyền thông để lưu trữ, tìm kiếm, truyền và xử lý thông tin. ICT là sự kết hợp của Tin học và Công nghệ truyền thông.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 2: Computer and programs
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 2,
              tieuDe: 'Máy tính và Chương trình',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751117278/Slooh/ifplb0ovh8iewbgqf6ha.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Máy tính là thiết bị thực hiện chương trình để nhận, xử lý dữ liệu và tạo ra thông tin. Chương trình là dãy lệnh điều khiển máy tính.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 3: Computer model
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 3,
              tieuDe: 'Mô hình máy tính',
              hinhAnh:
                'https://gochocit.com/wp-content/uploads/2021/08/cac-thanh-phan-may-tinh.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Mô hình cơ bản gồm các thiết bị vào (Input), bộ nhớ chính (Main Memory), bộ xử lý (Processor), các thiết bị ra (Output), thiết bị lưu trữ (Storage) và thiết bị truyền thông (Communication Devices).',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 4: Computer classification
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 4,
              tieuDe: 'Phân loại máy tính',
              hinhAnh: 'https://tuhocict.com/wp-content/uploads/2022/08/computer_network.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650789/Slooh-theme/theme-winter_qqva2u.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Các loại máy tính hiện đại bao gồm siêu máy tính, máy tính lớn, máy tính tầm trung, máy tính cá nhân, thiết bị di động và máy tính nhúng.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 5: Information system
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 5,
              tieuDe: 'Hệ thống thông tin',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751117244/Slooh/nltiluqj9ptzumjmnhi8.jpg',
              hinhNen: null,
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Hệ thống thông tin gồm 6 phần: con người, quy trình, phần mềm, phần cứng, dữ liệu và kết nối mạng. CNTT nghiên cứu và xây dựng các hệ thống thông tin.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 6: Information system components
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 6,
              tieuDe: 'Thành phần của hệ thống thông tin',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Con người (người dùng và quản trị viên), quy trình (hướng dẫn sử dụng), phần mềm (hệ thống và ứng dụng), phần cứng, dữ liệu và kết nối mạng là các thành phần quan trọng.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 7: Data, information, knowledge
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 7,
              tieuDe: 'Dữ liệu, thông tin và tri thức',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825611/Theme-bg/bg-image-4_w8bkto.jpg',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Dữ liệu là yếu tố thô chưa xử lý. Thông tin là dữ liệu đã được xử lý. Tri thức là sự hiểu biết dựa trên dữ liệu và thông tin. Tất cả đều được mã hóa thành số nhị phân.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 8: Network connection
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 8,
              tieuDe: 'Kết nối mạng',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Kết nối mạng cho phép chia sẻ thông tin giữa các máy tính. Bao gồm mạng máy tính, Internet, Web, điện toán đám mây, truyền thông không dây và Internet vạn vật (IoT).',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 9: Question 1
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 9,
              tieuDe: 'Công nghệ thông tin và truyền thông (ICT) là sự kết hợp của:',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650786/Slooh-theme/theme-autumn_mot9cw.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 10,
              diem: 'GAP_DOI',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Tin học và Điện tử', ketQua: false },
                  { noiDung: 'Tin học và Công nghệ truyền thông', ketQua: true },
                  { noiDung: 'Toán học và Tin học', ketQua: false },
                  { noiDung: 'Điện tử và Công nghệ truyền thông', ketQua: false }
                ]
              }
            },
            // Page 10: Question 2
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 10,
              tieuDe: 'Mô hình cơ bản của máy tính KHÔNG bao gồm thành phần nào sau đây?',
              hinhAnh: '',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825329/Theme-bg/theme-soccer_fawxcc.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 10,
              diem: 'GAP_DOI',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Bộ xử lý', ketQua: false },
                  { noiDung: 'Bộ nhớ chính', ketQua: false },
                  { noiDung: 'Thiết bị in', ketQua: false },
                  { noiDung: 'Nguồn điện xoay chiều', ketQua: true }
                ]
              }
            },
            // Page 11: Question 3
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 11,
              tieuDe: 'Hệ thống thông tin bao gồm những thành phần nào?',
              hinhAnh: '',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650786/Slooh-theme/theme-autumn_mot9cw.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 10,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Con người', ketQua: false },
                  { noiDung: 'Phần mềm', ketQua: true },
                  { noiDung: 'Phần cứng', ketQua: true },
                  { noiDung: 'Dữ liệu', ketQua: true }
                ]
              }
            },
            // Page 12: Question 4
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 12,
              tieuDe: 'Máy tính nhúng được sử dụng trong:',
              hinhAnh: null,
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825611/Theme-bg/bg-image-4_w8bkto.jpg',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 10,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Điện thoại thông minh', ketQua: false },
                  { noiDung: 'Máy tính để bàn', ketQua: false },
                  { noiDung: 'Bộ điều khiển trong ô tô', ketQua: true },
                  { noiDung: 'Máy ATM', ketQua: true },
                  { noiDung: 'Máy tính xách tay', ketQua: false }
                ]
              }
            }
          ]
        }
      }
    });

    console.log('✅ Public room "Giới thiệu chung về CNTT" created successfully');

    // Create third public room "Spotify"
    const spotifyRoom = await prisma.pHONG.create({
      data: {
        tenPhong: 'Spotify',
        hoatDong: 'OFFLINE',
        trangThai: 'HOAT_DONG',
        maNguoiTao: ducTruyenUser.maNguoiDung,
        trangs: {
          create: [
            // Page 1: Introduction to Spotify
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 1,
              tieuDe: 'Giới thiệu về Spotify',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750429001/Slooh/u2bvelrs7xxcbdifrn73.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'TRICH_DAN',
              noiDung:
                '<b>Spotify là một dịch vụ cung cấp nhạc, podcast và video kỹ thuật số</b> cho phép bạn truy cập hàng triệu bài hát và các nội dung khác của các nghệ sĩ trên khắp thế giới.<div><br><div>Các chức năng cơ bản như phát nhạc là hoàn toàn miễn phí, nhưng bạn cũng có thể chọn nâng cấp lên Spotify Premium.</div><div><br></div><div>Cho dù có dùng gói Premium hay không, bạn đều có thể:</div><div>- Nhận đề xuất dựa trên sở thích của bạn\n</div><div>- Xây dựng bộ sưu tập nhạc và podcast\n</div><div>- Và nhiều lợi ích khác!</div><div>- Nghe nhạc miễn phí</div><div><b>\n</b></div><div><b>\n</b></div></div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 2: How to use Spotify
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 2,
              tieuDe: 'Cách sử dụng Spotify',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750429195/Slooh/t1wt0qfg3ftcjtyqqdyr.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'HAI_COT',
              noiDung:
                '<b>Spotify </b>là một kho nhạc đa dạng với số lượng hàng triệu các bài hát, bạn có thể tìm bài hát yêu thích của mình theo cách sau:<span style="font-size: 1.25rem; color: rgb(2, 8, 23);"> </span><div><div><div>\n</div><div>\n</div></div><div>\n</div><div>- Vào ứng dụng Spotify > Chọn biểu tượng Tìm kiếm (hình kính lúp) tại phía trên màn hình > Nhập tên bài hát cần tìm vào ô tìm kiếm.</div><div><br></div><div><b>Spotify </b>hỗ trợ chức năng Playlist cho phép người dùng có thể sắp xếp các bài hát yêu thích của mình theo ý thích, tạo nên những phút giây tận hưởng âm nhạc trọn vẹn.\n</div><div><br></div><div><b>Thêm bài hát bạn thích vào Playlist:\n</b></div><div>Nhấp chuột phải vào tên bài hát > Rê chuột đến tùy chọn Add to Playlist (thêm bài hát vào danh sách) > Tùy chọn vào danh sách cũ hoặc New playlist (danh sách mới).</div><div>\n</div><div>\n</div></div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 3: Question 1
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 3,
              tieuDe: '<b>Spotify có dễ để sử dụng hay không</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750429488/Slooh/tdan1tjitrpckb9n3ugy.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'CO_BAN',
              noiDung: 'dsgdgsdgsdgsdgs',
              thoiGianGioiHan: 10,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'TRUE_FALSE',
              luaChon: {
                create: [
                  { noiDung: 'Có', ketQua: true },
                  { noiDung: 'Không', ketQua: false }
                ]
              }
            },
            // Page 4: Getting started with Spotify
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 4,
              tieuDe: '<b>Bắt đầu sử dụng Spotify</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750429195/Slooh/t1wt0qfg3ftcjtyqqdyr.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: 'HAI_COT',
              noiDung:
                'Chỉ cần vài bước nữa là bạn đã có thể thưởng thức hàng nghìn podcast, hàng triệu bài hát rồi!<div>  <div><b></b></div><div><b></b></div><div><b></b></div><div>\n</div><div><b>Tải ứng dụng\n</b></div><div>Bạn có thể dùng Spotify trên máy tính, điện thoại di động, máy tính bảng, TV, ô tô, đồng hồ và nhiều thiết bị khác!\n</div><div><br></div><div><b>Tạo tài khoản\n</b></div><div>Bạn chỉ cần chọn ĐĂNG KÝ trong màn hình đăng nhập trong ứng dụng hoặc truy cập vào spotify.com/signup.\n</div><div><br></div><div>Bạn có thể sử dụng địa chỉ email, số điện thoại hoặc tài khoản Apple.\n</div><div>Các thông tin đăng ký khác, chẳng hạn như giới tính, ngày sinh và tên chúng tôi có thể gọi bạn (tên hiển thị của bạn) là không bắt buộc.</div><div>\n</div><div>\n</div><div>\n</div></div>',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 5: Question 2
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 5,
              tieuDe: '<b>Gói Premium Bao nhiêu tiền</b>',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1750429357/Slooh/mfklgxj7iyip1vg7ntsh.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744650787/Slooh-theme/theme-spring_kzdjht.webp',
              canLeNoiDung: '',
              canLeTieuDe: 'center',
              cachTrinhBay: null,
              noiDung: null,
              thoiGianGioiHan: 5,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  { noiDung: '100k', ketQua: false },
                  { noiDung: '200k', ketQua: false },
                  { noiDung: '300k', ketQua: false },
                  { noiDung: '30k', ketQua: true }
                ]
              }
            }
          ]
        }
      }
    });

    console.log('✅ Public room "Spotify" created successfully');

    // Create channel "Node - Begin"
    const nodeChannel = await prisma.kENH.create({
      data: {
        tenKenh: 'Node - Begin',
        trangThai: 'HOAT_DONG'
      }
    });

    console.log('✅ Channel "Node - Begin" created successfully');

    // Create room "So sánh CSR vs SSR" in the channel
    const csrSsrRoom = await prisma.pHONG.create({
      data: {
        tenPhong: 'So sánh CSR vs SSR',
        hoatDong: 'OFFLINE',
        trangThai: 'HOAT_DONG',
        maKenh: nodeChannel.maKenh,
        maNguoiTao: ducTruyenUser.maNguoiDung,
        trangs: {
          create: [
            // Page 1: Overview
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 1,
              tieuDe: 'Tổng quan về Rendering',
              hinhAnh: 'https://seomentor.vn/wp-content/uploads/2021/07/SSR-vs-CSR-2.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Rendering là quá trình chuyển đổi code (HTML, CSS, JavaScript) thành giao diện người dùng.  Dữ liệu từ server được browser diễn giải và hiển thị. CSR và SSR là hai cách tiếp cận khác nhau trong quá trình này.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 2: Question 1
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 2,
              tieuDe: 'Câu hỏi 1: Rendering là gì?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110013/Slooh/ep2qpuuobcblrr7qu4op.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Quá trình người dùng tương tác với website', ketQua: false },
                  { noiDung: 'Quá trình chuyển đổi code thành giao diện người dùng', ketQua: true },
                  { noiDung: 'Quá trình server xử lý dữ liệu', ketQua: false },
                  { noiDung: 'Quá trình lưu trữ dữ liệu trên server', ketQua: false }
                ]
              }
            },
            // Page 3: CSR content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 3,
              tieuDe: 'CSR (Client-Side Rendering)',
              hinhAnh:
                'https://kruschecompany.com/wp-content/uploads/2018/07/CSR-client-side-rendering-infographic.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'Trong CSR, browser tải HTML cơ bản và các file JavaScript. JavaScript render toàn bộ giao diện. Server gửi dữ liệu cho client thông qua các yêu cầu fetch.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 4: Question 2
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 4,
              tieuDe:
                'Câu hỏi 2: Trong CSR, phần nào chịu trách nhiệm chính trong việc hiển thị giao diện?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110013/Slooh/ep2qpuuobcblrr7qu4op.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Server', ketQua: false },
                  { noiDung: 'Browser', ketQua: true },
                  { noiDung: 'Cả server và browser', ketQua: false },
                  { noiDung: 'Database', ketQua: false }
                ]
              }
            },
            // Page 5: SSR content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 5,
              tieuDe: 'SSR (Server-Side Rendering)',
              hinhAnh: 'https://caodang.fpt.edu.vn/wp-content/uploads/2023/12/NH21.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'SSR ngược lại với CSR. Server render HTML hoàn chỉnh và gửi cho browser. Browser chỉ cần load HTML để hiển thị ngay lập tức. JavaScript client-side hỗ trợ tương tác.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 6: Question 3
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 6,
              tieuDe: 'Câu hỏi 3:  Điểm khác biệt chính giữa CSR và SSR là gì?',
              hinhAnh: 'https://seomentor.vn/wp-content/uploads/2021/07/SSR-vs-CSR-2.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'MULTI_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'Vị trí render HTML (client hay server)', ketQua: true },
                  { noiDung: 'Ngôn ngữ lập trình sử dụng', ketQua: false },
                  { noiDung: 'Loại database sử dụng', ketQua: false },
                  { noiDung: 'Thời gian load trang', ketQua: true }
                ]
              }
            },
            // Page 7: Performance content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 7,
              tieuDe: 'Hiệu năng (Performance)',
              hinhAnh: 'https://www.testing.vn/wp-content/uploads/2023/05/Kiem-thu-hieu-nang.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'CSR: Load ban đầu chậm, nhưng chuyển trang mượt. SSR: Load ban đầu nhanh, nhưng chuyển trang có thể chậm nếu server xử lý chậm.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 8: Question 4
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 8,
              tieuDe: 'Câu hỏi 4:  Khẳng định nào về hiệu năng của CSR và SSR là đúng?',
              hinhAnh:
                'http://res.cloudinary.com/dzdfgj03g/image/upload/v1751110013/Slooh/ep2qpuuobcblrr7qu4op.jpg',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'TRUE_FALSE',
              luaChon: {
                create: [
                  { noiDung: 'CSR thường có thời gian load ban đầu nhanh hơn SSR.', ketQua: false },
                  { noiDung: 'SSR thường có thời gian load ban đầu nhanh hơn CSR.', ketQua: true }
                ]
              }
            },
            // Page 9: SEO content
            {
              loaiTrang: 'NOI_DUNG',
              thuTu: 9,
              tieuDe: 'SEO',
              hinhAnh:
                'https://blog.shopline.com.vn/wp-content/uploads/2022/01/a1d39b9944184055866844a5d88fdec3.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung:
                'SSR tốt hơn CSR về SEO vì HTML đầy đủ được gửi ngay, dễ index. CSR hạn chế hơn vì nội dung trong JS, khó cho bot tìm kiếm.',
              thoiGianGioiHan: null,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: null
            },
            // Page 10: Question 5
            {
              loaiTrang: 'CAU_HOI',
              thuTu: 10,
              tieuDe: 'Câu hỏi 5: Phương pháp nào tốt hơn cho SEO?',
              hinhAnh:
                'https://blog.shopline.com.vn/wp-content/uploads/2022/01/a1d39b9944184055866844a5d88fdec3.png',
              hinhNen:
                'https://res.cloudinary.com/dzdfgj03g/image/upload/w_300/v1744825607/Theme-bg/theme-technology_ya6hco.webp',
              canLeNoiDung: '',
              canLeTieuDe: '',
              cachTrinhBay: null,
              noiDung: '',
              thoiGianGioiHan: 30,
              diem: 'BINH_THUONG',
              loaiCauTraLoi: 'SINGLE_SELECT',
              luaChon: {
                create: [
                  { noiDung: 'CSR', ketQua: false },
                  { noiDung: 'SSR', ketQua: true },
                  { noiDung: 'Cả hai đều như nhau', ketQua: false },
                  { noiDung: 'Không thể xác định', ketQua: false }
                ]
              }
            }
          ]
        }
      }
    });

    console.log('✅ Room "So sánh CSR vs SSR" created successfully in channel "Node - Begin"');

    // Get all users to add them to the channel
    const allUsers = await prisma.nGUOIDUNG.findMany({
      select: { maNguoiDung: true, email: true }
    });

    // Add all users to the "Node - Begin" channel
    for (const user of allUsers) {
      await prisma.tHANHVIENKENH.create({
        data: {
          maNguoiDung: user.maNguoiDung,
          maKenh: nodeChannel.maKenh,
          vaiTro: user.email === 'ductruyen@slooh.com' ? 'CHU_KENH' : 'THANH_VIEN',
          trangThai: 'THAM_GIA'
        }
      });
    }

    console.log(`✅ Added ${allUsers.length} users to channel "Node - Begin"`);
    console.log('🌱 Database seeding completed successfully!');
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
