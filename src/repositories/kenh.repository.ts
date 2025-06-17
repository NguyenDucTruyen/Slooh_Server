// src/repositories/kenh.repository.ts
import { Prisma, PrismaClient, TrangThai, TrangThaiThanhVien, VaiTroKenh } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChannelWithMembers {
  maKenh: string;
  tenKenh: string;
  trangThai: TrangThai;
  ngayTao: Date;
  ngayXoa: Date | null;
  thanhVien: any[];
}

export interface MemberWithUser {
  maThanhVienKenh: string;
  maNguoiDung: string;
  maKenh: string;
  vaiTro: VaiTroKenh;
  trangThai: TrangThaiThanhVien;
  ngayTao: Date;
  nguoiDung: any;
}

export interface MemberWithChannel {
  maThanhVienKenh: string;
  maNguoiDung: string;
  maKenh: string;
  vaiTro: VaiTroKenh;
  trangThai: TrangThaiThanhVien;
  ngayTao: Date;
  kenh: any;
}

class KenhRepository {
  // Channel operations
  async createChannel(channelName: string, userId: string) {
    return prisma.kENH.create({
      data: {
        tenKenh: channelName,
        thanhVien: {
          create: {
            maNguoiDung: userId,
            vaiTro: VaiTroKenh.CHU_KENH,
            trangThai: TrangThaiThanhVien.THAM_GIA
          }
        }
      }
    });
  }

  async updateChannel(channelId: string, channelName: string) {
    return prisma.kENH.update({
      where: { maKenh: channelId },
      data: { tenKenh: channelName }
    });
  }

  async updateChannelStatus(channelId: string, trangThai: TrangThai) {
    return prisma.kENH.update({
      where: { maKenh: channelId },
      data: { trangThai }
    });
  }

  async softDeleteChannel(channelId: string) {
    return prisma.kENH.update({
      where: { maKenh: channelId },
      data: {
        trangThai: TrangThai.KHOA,
        ngayXoa: new Date()
      }
    });
  }

  async findChannelById(channelId: string): Promise<ChannelWithMembers | null> {
    return prisma.kENH.findUnique({
      where: { maKenh: channelId },
      include: {
        thanhVien: {
          include: { nguoiDung: true }
        }
      }
    });
  }

  async findChannelsByOwner(userId: string, skip: number, take: number) {
    const [channels, total] = await Promise.all([
      prisma.kENH.findMany({
        where: {
          ngayXoa: null,
          thanhVien: {
            some: {
              maNguoiDung: userId,
              vaiTro: VaiTroKenh.CHU_KENH
            }
          }
        },
        include: {
          thanhVien: {
            include: { nguoiDung: true }
          }
        },
        skip,
        take
      }),
      prisma.kENH.count({
        where: {
          ngayXoa: null,
          thanhVien: {
            some: {
              maNguoiDung: userId,
              vaiTro: VaiTroKenh.CHU_KENH
            }
          }
        }
      })
    ]);

    return { channels, total };
  }

  async findAllChannels(skip: number, take: number) {
    const [channels, total] = await Promise.all([
      prisma.kENH.findMany({
        where: { ngayXoa: null },
        include: {
          thanhVien: {
            include: { nguoiDung: true }
          }
        },
        skip,
        take
      }),
      prisma.kENH.count({ where: { ngayXoa: null } })
    ]);

    return { channels, total };
  }

  // Member operations
  async findMemberByUserAndChannel(userId: string, channelId: string) {
    return prisma.tHANHVIENKENH.findUnique({
      where: {
        maNguoiDung_maKenh: {
          maNguoiDung: userId,
          maKenh: channelId
        }
      }
    });
  }

  async createOrUpdateMember(
    userId: string,
    channelId: string,
    vaiTro: VaiTroKenh,
    trangThai: TrangThaiThanhVien
  ) {
    return prisma.tHANHVIENKENH.upsert({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      },
      update: {
        trangThai: trangThai
      },
      create: {
        maKenh: channelId,
        maNguoiDung: userId,
        vaiTro: vaiTro,
        trangThai: trangThai
      }
    });
  }

  async createManyMembers(data: Prisma.THANHVIENKENHCreateManyInput[]) {
    return prisma.tHANHVIENKENH.createMany({
      data,
      skipDuplicates: true
    });
  }

  async updateMemberStatus(userId: string, channelId: string, status: TrangThaiThanhVien) {
    return prisma.tHANHVIENKENH.update({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      },
      data: { trangThai: status }
    });
  }

  async deleteMember(userId: string, channelId: string) {
    return prisma.tHANHVIENKENH.delete({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });
  }

  async deleteManyMembers(channelId: string, userIds: string[]) {
    return prisma.tHANHVIENKENH.deleteMany({
      where: {
        maKenh: channelId,
        maNguoiDung: { in: userIds }
      }
    });
  }

  // Search operations
  async searchChannelMembers(channelId: string, searchText: string, skip: number, take: number) {
    const [users, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maKenh: channelId,
          nguoiDung: {
            OR: [
              { email: { contains: searchText, mode: 'insensitive' } },
              { hoTen: { contains: searchText, mode: 'insensitive' } }
            ]
          }
        },
        include: {
          nguoiDung: {
            select: {
              email: true,
              hoTen: true,
              anhDaiDien: true
            }
          }
        },
        skip,
        take
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maKenh: channelId,
          nguoiDung: {
            OR: [
              { email: { contains: searchText, mode: 'insensitive' } },
              { hoTen: { contains: searchText, mode: 'insensitive' } }
            ]
          }
        }
      })
    ]);

    return { users, total };
  }

  async findJoinedChannels(userId: string, skip: number, take: number) {
    const [channels, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.THAM_GIA,
          kenh: { ngayXoa: null },
          vaiTro: VaiTroKenh.THANH_VIEN
        },
        include: {
          kenh: true
        },
        skip,
        take
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.THAM_GIA,
          kenh: { ngayXoa: null },
          vaiTro: VaiTroKenh.THANH_VIEN
        }
      })
    ]);

    return { channels, total };
  }

  async findPendingRequests(userId: string, skip: number, take: number) {
    const [channels, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.YEU_CAU,
          kenh: { ngayXoa: null }
        },
        include: {
          kenh: true
        },
        skip,
        take
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.YEU_CAU,
          kenh: { ngayXoa: null }
        }
      })
    ]);

    return { channels, total };
  }

  // User operations
  async findUsersByEmails(emails: string[]) {
    return prisma.nGUOIDUNG.findMany({
      where: { email: { in: emails } }
    });
  }

  // Batch operations
  async updateManyMembersStatus(channelId: string, userIds: string[], status: TrangThaiThanhVien) {
    return Promise.all(userIds.map((userId) => this.updateMemberStatus(userId, channelId, status)));
  }

  async deleteManyMembersByUserIds(channelId: string, userIds: string[]) {
    return Promise.all(
      userIds.map((userId) =>
        prisma.tHANHVIENKENH.deleteMany({
          where: {
            maKenh: channelId,
            maNguoiDung: userId
          }
        })
      )
    );
  }

  // Get channels owned by user
  async findChannelsOwnedByUser(userId: string) {
    return prisma.kENH.findMany({
      where: {
        ngayXoa: null,
        thanhVien: {
          some: {
            maNguoiDung: userId,
            vaiTro: VaiTroKenh.CHU_KENH
          }
        }
      },
      select: {
        maKenh: true
      }
    });
  }
}

export default new KenhRepository();
