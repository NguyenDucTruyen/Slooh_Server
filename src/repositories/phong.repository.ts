// src\repositories\phong.repository.ts
import {
  Diem,
  HoatDongPhong,
  LoaiCauTraLoi,
  LoaiTrang,
  PrismaClient,
  TrangThai
} from '@prisma/client';

const prisma = new PrismaClient();

const findRoomByNameAndChannel = async (roomName: string, channelId: string) => {
  return prisma.pHONG.findFirst({
    where: {
      tenPhong: roomName,
      maKenh: channelId
    }
  });
};

const createRoom = async (roomName: string, channelId: string) => {
  return prisma.pHONG.create({
    data: {
      tenPhong: roomName,
      maKenh: channelId,
      trangThai: TrangThai.HOAT_DONG,
      hoatDong: HoatDongPhong.OFFLINE
    }
  });
};

const getRoomById = async (roomId: string) => {
  return prisma.pHONG.findUnique({
    where: { maPhong: roomId },
    include: {
      trangs: {
        orderBy: { thuTu: 'asc' },
        include: {
          luaChon: true
        }
      }
    }
  });
};

const updateRoom = async (roomId: string, roomData: any) => {
  return prisma.$transaction(async (tx) => {
    // Update basic room info
    const updatedRoom = await tx.pHONG.update({
      where: { maPhong: roomId },
      data: {
        tenPhong: roomData.tenPhong,
        moTa: roomData.moTa,
        trangThai: roomData.trangThai,
        hoatDong: roomData.hoatDong
      }
    });

    // Delete all existing pages and their choices (cascade will handle choices)
    await tx.tRANG.deleteMany({
      where: { maPhong: roomId }
    });

    // Create new pages with their choices
    if (roomData.danhSachTrang && roomData.danhSachTrang.length > 0) {
      for (let i = 0; i < roomData.danhSachTrang.length; i++) {
        const trangData = roomData.danhSachTrang[i];

        const newTrang = await tx.tRANG.create({
          data: {
            maPhong: roomId,
            loaiTrang: trangData.loaiTrang as LoaiTrang,
            thuTu: i + 1,
            tieuDe: trangData.tieuDe || '',
            hinhAnh: trangData.hinhAnh,
            video: trangData.video,
            hinhNen: trangData.hinhNen,
            cachTrinhBay: trangData.cachTrinhBay || '',
            noiDung: trangData.noiDung,
            thoiGianGioiHan: trangData.thoiGianGioiHan,
            diem: (trangData.diem as Diem) || Diem.BINH_THUONG,
            loaiCauTraLoi: trangData.loaiCauTraLoi as LoaiCauTraLoi
          }
        });

        // Create choices for this page
        if (trangData.danhSachLuaChon && trangData.danhSachLuaChon.length > 0) {
          const luaChonData = trangData.danhSachLuaChon.map((luaChon: any) => ({
            maTrang: newTrang.maTrang,
            noiDung: luaChon.noiDung,
            ketQua: luaChon.ketQua || false
          }));

          await tx.lUACHON.createMany({
            data: luaChonData
          });
        }
      }
    }

    // Return the updated room with all relations
    return tx.pHONG.findUnique({
      where: { maPhong: roomId },
      include: {
        trangs: {
          orderBy: { thuTu: 'asc' },
          include: {
            luaChon: true
          }
        }
      }
    });
  });
};

const checkRoomExists = async (roomId: string) => {
  const room = await prisma.pHONG.findUnique({
    where: { maPhong: roomId }
  });
  return !!room;
};

export default {
  findRoomByNameAndChannel,
  createRoom,
  getRoomById,
  updateRoom,
  checkRoomExists
};
