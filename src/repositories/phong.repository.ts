// src/repositories/phong.repository.ts
import { Diem, HoatDongPhong, PrismaClient, TrangThai } from '@prisma/client';

const prisma = new PrismaClient();

const findRoomByNameAndChannel = async (roomName: string, channelId: string | null) => {
  return prisma.pHONG.findFirst({
    where: {
      tenPhong: roomName,
      maKenh: channelId
    }
  });
};

const createRoom = async (roomName: string, channelId: string | null) => {
  return prisma.pHONG.create({
    data: {
      tenPhong: roomName,
      maKenh: channelId,
      trangThai: TrangThai.HOAT_DONG,
      hoatDong: HoatDongPhong.OFFLINE
    }
  });
};

const createPublicRoom = async (maNguoiDung: string, roomName: string, description?: string) => {
  return prisma.pHONG.create({
    data: {
      tenPhong: roomName,
      moTa: description,
      maKenh: null,
      trangThai: TrangThai.HOAT_DONG,
      hoatDong: HoatDongPhong.OFFLINE,
      maNguoiTao: maNguoiDung
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
      },
      kenh: {
        include: {
          thanhVien: {
            where: {
              vaiTro: 'CHU_KENH'
            },
            include: {
              nguoiDung: {
                select: {
                  maNguoiDung: true,
                  hoTen: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });
};

const getRoomsByChannelId = async (channelId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        maKenh: channelId,
        ngayXoa: null
      },
      include: {
        _count: {
          select: {
            trangs: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        ngayTao: 'desc'
      }
    }),
    prisma.pHONG.count({
      where: {
        maKenh: channelId,
        ngayXoa: null
      }
    })
  ]);

  return { rooms, total };
};

const getRoomsOwnedByUser = async (channelIds: string[], page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        OR: [
          // Rooms in channels owned by user
          {
            maKenh: {
              in: channelIds
            },
            ngayXoa: null
          }
          // Public rooms (if user is admin or we want to include them)
          // {
          //   maKenh: null,
          //   ngayXoa: null
          // }
        ]
      },
      include: {
        kenh: {
          select: {
            maKenh: true,
            tenKenh: true
          }
        },
        _count: {
          select: {
            trangs: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        ngayTao: 'desc'
      }
    }),
    prisma.pHONG.count({
      where: {
        OR: [
          {
            maKenh: {
              in: channelIds
            },
            ngayXoa: null
          }
        ]
      }
    })
  ]);

  return { rooms, total };
};

const getPublicRooms = async (maNguoiDung: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        maNguoiTao: maNguoiDung,
        maKenh: null,
        ngayXoa: null,
        trangThai: TrangThai.HOAT_DONG
      },
      include: {
        _count: {
          select: {
            trangs: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        ngayTao: 'desc'
      }
    }),
    prisma.pHONG.count({
      where: {
        maNguoiTao: maNguoiDung, // Thêm filter này
        maKenh: null,
        ngayXoa: null,
        trangThai: TrangThai.HOAT_DONG
      }
    })
  ]);

  return { rooms, total };
};

const updateRoom = async (roomId: string, roomData: any) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update room info
    await tx.pHONG.update({
      where: { maPhong: roomId },
      data: {
        tenPhong: roomData.tenPhong,
        moTa: roomData.moTa,
        trangThai: roomData.trangThai,
        hoatDong: roomData.hoatDong
      }
    });

    // 2. Get existing pages
    const currentRoom = await tx.pHONG.findUnique({
      where: { maPhong: roomId },
      include: {
        trangs: {
          include: { luaChon: true }
        }
      }
    });

    const oldTrangMap = new Map(currentRoom?.trangs.map((t) => [t.maTrang, t]));

    const newTrangIds = new Set<string>();

    for (let i = 0; i < roomData.danhSachTrang.length; i++) {
      const trangData = roomData.danhSachTrang[i];
      const maTrang = trangData.maTrang;

      newTrangIds.add(maTrang);

      if (oldTrangMap.has(maTrang)) {
        // Update trang
        await tx.tRANG.update({
          where: { maTrang },
          data: {
            loaiTrang: trangData.loaiTrang,
            thuTu: i + 1,
            tieuDe: trangData.tieuDe || '',
            hinhAnh: trangData.hinhAnh,
            video: trangData.video,
            hinhNen: trangData.hinhNen,
            cachTrinhBay: trangData.cachTrinhBay || '',
            canLeTieuDe: trangData.canLeTieuDe || '',
            canLeNoiDung: trangData.canLeNoiDung || '',
            noiDung: trangData.noiDung,
            thoiGianGioiHan: trangData.thoiGianGioiHan,
            diem: trangData.diem || Diem.BINH_THUONG,
            loaiCauTraLoi: trangData.loaiCauTraLoi
          }
        });

        // Update LuaChon:
        // Xóa toàn bộ lựa chọn cũ rồi thêm lại (hoặc diff tương tự như trên nếu muốn tối ưu hơn)
        await tx.lUACHON.deleteMany({ where: { maTrang } });

        if (Array.isArray(trangData.danhSachLuaChon)) {
          const newChoices = trangData.danhSachLuaChon.map((lc: any) => ({
            maTrang,
            noiDung: lc.noiDung,
            ketQua: lc.ketQua || false
          }));
          await tx.lUACHON.createMany({ data: newChoices });
        }
      } else {
        // Tạo mới trang
        const newTrang = await tx.tRANG.create({
          data: {
            maPhong: roomId,
            loaiTrang: trangData.loaiTrang,
            thuTu: i + 1,
            tieuDe: trangData.tieuDe || '',
            hinhAnh: trangData.hinhAnh,
            video: trangData.video,
            hinhNen: trangData.hinhNen,
            cachTrinhBay: trangData.cachTrinhBay || '',
            canLeTieuDe: trangData.canLeTieuDe || '',
            canLeNoiDung: trangData.canLeNoiDung || '',
            noiDung: trangData.noiDung,
            thoiGianGioiHan: trangData.thoiGianGioHan,
            diem: trangData.diem || Diem.BINH_THUONG,
            loaiCauTraLoi: trangData.loaiCauTraLoi
          }
        });

        if (Array.isArray(trangData.danhSachLuaChon)) {
          const newChoices = trangData.danhSachLuaChon.map((lc: any) => ({
            maTrang: newTrang.maTrang,
            noiDung: lc.noiDung,
            ketQua: lc.ketQua || false
          }));
          await tx.lUACHON.createMany({ data: newChoices });
        }
      }
    }

    // 3. Xóa các trang cũ không còn trong danh sách mới
    const trangCanXoa = currentRoom?.trangs.filter((t) => !newTrangIds.has(t.maTrang)) || [];
    for (const trang of trangCanXoa) {
      await tx.tRANG.delete({ where: { maTrang: trang.maTrang } });
    }

    // 4. Trả về kết quả đầy đủ
    return tx.pHONG.findUnique({
      where: { maPhong: roomId },
      include: {
        trangs: {
          orderBy: { thuTu: 'asc' },
          include: { luaChon: true }
        }
      }
    });
  });
};

const deleteRoom = async (roomId: string) => {
  return prisma.pHONG.update({
    where: { maPhong: roomId },
    data: {
      ngayXoa: new Date()
    }
  });
};

const cloneRoom = async (
  sourceRoomId: string,
  userId: string,
  targetChannelId: string | null = null
) => {
  // Get the source room with all its data
  const sourceRoom = await prisma.pHONG.findUnique({
    where: { maPhong: sourceRoomId },
    include: {
      trangs: {
        include: {
          luaChon: true
        }
      }
    }
  });

  if (!sourceRoom) {
    throw new Error('Không tìm thấy phòng để sao chép');
  }

  // Start a transaction to ensure all operations succeed or fail together
  return prisma.$transaction(async (tx) => {
    // Create new room with same basic data but with new channel if specified
    const newRoom = await tx.pHONG.create({
      data: {
        tenPhong: `${sourceRoom.tenPhong} (Copy)`,
        moTa: sourceRoom.moTa,
        maKenh: targetChannelId, // Use the specified target channel
        maNguoiTao: userId,
        trangThai: TrangThai.HOAT_DONG,
        hoatDong: sourceRoom.hoatDong
      }
    });

    // Clone all pages and their choices
    for (const trang of sourceRoom.trangs) {
      const newTrang = await tx.tRANG.create({
        data: {
          maPhong: newRoom.maPhong,
          loaiTrang: trang.loaiTrang,
          thuTu: trang.thuTu,
          tieuDe: trang.tieuDe,
          hinhAnh: trang.hinhAnh,
          video: trang.video,
          hinhNen: trang.hinhNen,
          cachTrinhBay: trang.cachTrinhBay,
          canLeTieuDe: trang.canLeTieuDe,
          canLeNoiDung: trang.canLeNoiDung,
          noiDung: trang.noiDung,
          thoiGianGioiHan: trang.thoiGianGioiHan,
          diem: trang.diem,
          loaiCauTraLoi: trang.loaiCauTraLoi
        }
      });

      // Clone choices if they exist
      if (trang.luaChon && trang.luaChon.length > 0) {
        await tx.lUACHON.createMany({
          data: trang.luaChon.map((luaChon) => ({
            maTrang: newTrang.maTrang,
            noiDung: luaChon.noiDung,
            ketQua: luaChon.ketQua
          }))
        });
      }
    }

    // Return the new room with all its data
    return tx.pHONG.findUnique({
      where: { maPhong: newRoom.maPhong },
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

const checkRoomOwnership = async (roomId: string, userId: string) => {
  const room = await prisma.pHONG.findUnique({
    where: { maPhong: roomId },
    include: {
      kenh: {
        include: {
          thanhVien: {
            where: {
              maNguoiDung: userId,
              vaiTro: 'CHU_KENH'
            }
          }
        }
      }
    }
  });

  // Public room - no specific owner
  if (!room?.maKenh) {
    return { isOwner: false, isPublic: true };
  }

  // Channel room - check if user is channel owner
  const isOwner = (room.kenh?.thanhVien ?? []).length > 0;
  return { isOwner, isPublic: false };
};

export default {
  findRoomByNameAndChannel,
  createRoom,
  createPublicRoom,
  getRoomById,
  getRoomsByChannelId,
  getRoomsOwnedByUser,
  getPublicRooms,
  updateRoom,
  deleteRoom,
  cloneRoom,
  checkRoomExists,
  checkRoomOwnership
};
