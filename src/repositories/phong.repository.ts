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
          include: { luaChon: true },
          orderBy: { thuTu: 'asc' }
        }
      }
    });

    if (!currentRoom) {
      throw new Error('Room not found');
    }

    // Create maps for easier lookup
    const oldTrangMap = new Map(currentRoom.trangs.map((t) => [t.maTrang, t]));
    const newTrangIds = new Set<string>();

    // Track pages to delete first
    const trangIdsToDelete = currentRoom.trangs
      .filter((t) => !roomData.danhSachTrang.some((newT: any) => newT.maTrang === t.maTrang))
      .map((t) => t.maTrang);

    // Delete pages that are no longer in the new list
    if (trangIdsToDelete.length > 0) {
      await tx.tRANG.deleteMany({
        where: {
          maTrang: { in: trangIdsToDelete }
        }
      });
    }

    // Process pages in order
    for (let i = 0; i < roomData.danhSachTrang.length; i++) {
      const trangData = roomData.danhSachTrang[i];
      const maTrang = trangData.maTrang;
      const targetThuTu = i + 1;

      if (maTrang && oldTrangMap.has(maTrang)) {
        // Update existing page
        const oldTrang = oldTrangMap.get(maTrang)!;

        // Update the page
        await tx.tRANG.update({
          where: { maTrang },
          data: {
            loaiTrang: trangData.loaiTrang,
            thuTu: targetThuTu,
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

        // Update choices
        await tx.lUACHON.deleteMany({ where: { maTrang } });

        if (Array.isArray(trangData.danhSachLuaChon) && trangData.danhSachLuaChon.length > 0) {
          const newChoices = trangData.danhSachLuaChon.map((lc: any) => ({
            maTrang,
            noiDung: lc.noiDung,
            ketQua: lc.ketQua || false
          }));
          await tx.lUACHON.createMany({ data: newChoices });
        }
      } else {
        // Create new page
        const newTrang = await tx.tRANG.create({
          data: {
            maPhong: roomId,
            loaiTrang: trangData.loaiTrang,
            thuTu: targetThuTu,
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

        if (Array.isArray(trangData.danhSachLuaChon) && trangData.danhSachLuaChon.length > 0) {
          const newChoices = trangData.danhSachLuaChon.map((lc: any) => ({
            maTrang: newTrang.maTrang,
            noiDung: lc.noiDung,
            ketQua: lc.ketQua || false
          }));
          await tx.lUACHON.createMany({ data: newChoices });
        }
      }
    }

    // Return the updated room
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

// ADMIN: Get all rooms with pagination
const findAllRooms = async (skip: number, limit: number) => {
  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        ngayXoa: null
      },
      include: {
        kenh: {
          select: {
            maKenh: true,
            tenKenh: true
          }
        },
        nguoiTao: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
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
        ngayXoa: null
      }
    })
  ]);

  return { rooms, total };
};

// ADMIN: Get all rooms in specific channel with pagination
const findAllRoomsByChannel = async (channelId: string, skip: number, limit: number) => {
  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        maKenh: channelId,
        ngayXoa: null
      },
      include: {
        kenh: {
          select: {
            maKenh: true,
            tenKenh: true
          }
        },
        nguoiTao: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
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
        maKenh: channelId,
        ngayXoa: null
      }
    })
  ]);

  return { rooms, total };
};

// ADMIN: Get all public rooms with pagination
const findAllPublicRooms = async (skip: number, limit: number) => {
  const [rooms, total] = await Promise.all([
    prisma.pHONG.findMany({
      where: {
        maKenh: null,
        ngayXoa: null
      },
      include: {
        nguoiTao: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
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
        maKenh: null,
        ngayXoa: null
      }
    })
  ]);

  return { rooms, total };
};

// ADMIN: Update room status
const updateRoomStatus = async (roomId: string, trangThai: TrangThai) => {
  return prisma.pHONG.update({
    where: { maPhong: roomId },
    data: { trangThai }
  });
};

// Helper to find room by ID (used by service)
const findRoomById = async (roomId: string) => {
  return prisma.pHONG.findUnique({
    where: { maPhong: roomId }
  });
};

const createRoomWithPages = async (roomData: any, channelId: string) => {
  return await prisma.pHONG.create({
    data: {
      tenPhong: roomData.tenPhong,
      moTa: roomData.moTa,
      maKenh: channelId,
      trangThai: TrangThai.HOAT_DONG,
      hoatDong: HoatDongPhong.OFFLINE,
      trangs: {
        create: roomData.danhSachTrang.map((trang: any, index: number) => ({
          loaiTrang: trang.loaiTrang,
          thuTu: index + 1,
          tieuDe: trang.tieuDe,
          noiDung: trang.noiDung,
          thoiGianGioiHan: trang.thoiGianGioiHan,
          diem: trang.diem || Diem.BINH_THUONG,
          loaiCauTraLoi: trang.loaiCauTraLoi,
          luaChon: trang.danhSachLuaChon ? {
            create: trang.danhSachLuaChon.map((luaChon: any) => ({
              noiDung: luaChon.noiDung,
              ketQua: luaChon.ketQua
            }))
          } : undefined
        }))
      }
    },
    include: {
      trangs: {
        include: {
          luaChon: true
        },
        orderBy: {
          thuTu: 'asc'
        }
      }
    }
  });
};

const createPublicRoomWithPages = async (roomData: any, userId: string) => {
  return await prisma.pHONG.create({
    data: {
      tenPhong: roomData.tenPhong,
      moTa: roomData.moTa,
      maNguoiTao: userId,
      maKenh: null,
      trangThai: TrangThai.HOAT_DONG,
      hoatDong: HoatDongPhong.OFFLINE,
      trangs: {
        create: roomData.danhSachTrang.map((trang: any, index: number) => ({
          loaiTrang: trang.loaiTrang,
          thuTu: index + 1,
          tieuDe: trang.tieuDe,
          noiDung: trang.noiDung,
          thoiGianGioiHan: trang.thoiGianGioiHan,
          diem: trang.diem || Diem.BINH_THUONG,
          loaiCauTraLoi: trang.loaiCauTraLoi,
          luaChon: trang.danhSachLuaChon ? {
            create: trang.danhSachLuaChon.map((luaChon: any) => ({
              noiDung: luaChon.noiDung,
              ketQua: luaChon.ketQua
            }))
          } : undefined
        }))
      }
    },
    include: {
      trangs: {
        include: {
          luaChon: true
        },
        orderBy: {
          thuTu: 'asc'
        }
      }
    }
  });
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
  checkRoomOwnership,
  findAllRooms,
  findAllRoomsByChannel,
  findAllPublicRooms,
  updateRoomStatus,
  findRoomById,
  createRoomWithPages,      // Add new function
  createPublicRoomWithPages  // Add new function
};
