// src/repositories/phienTrinhChieu.repository.ts
import { PrismaClient, VaiTroPhien } from '@prisma/client';

const prisma = new PrismaClient();

class PhienTrinhChieuRepository {
  // Generate unique PIN code
  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create new presentation session
  async createPhien(
    maPhong: string,
    maNguoiTao: string
  ): Promise<{
    maPhien: string;
    maPhong: string;
    maPin: string;
    ngayTao: Date;
    phong: {
      trangs: {
        luaChon: any[];
      }[];
    };
    thanhVien: {
      maThanhVienPhien: any;
      nguoiDung: any;
    }[];
  }> {
    const maPin = this.generatePin();

    // Check if PIN already exists
    const existingPin = await prisma.pHIENTRINHCHIEU.findUnique({
      where: { maPin }
    });

    if (existingPin) {
      // Recursively generate new PIN if exists
      return this.createPhien(maPhong, maNguoiTao);
    }

    return prisma.pHIENTRINHCHIEU.create({
      data: {
        maPhong,
        maPin,
        thanhVien: {
          create: {
            maNguoiDung: maNguoiTao,
            tenThanhVien: '', // Will be filled from user data
            vaiTro: VaiTroPhien.CHU_PHIEN
          }
        }
      },
      include: {
        phong: {
          include: {
            trangs: {
              orderBy: { thuTu: 'asc' },
              include: {
                luaChon: true
              }
            }
          }
        },
        thanhVien: {
          include: {
            nguoiDung: true
          }
        }
      }
    });
  }

  // Get session by PIN
  async getPhienByPin(maPin: string) {
    return prisma.pHIENTRINHCHIEU.findUnique({
      where: { maPin },
      include: {
        phong: {
          include: {
            kenh: true,
            trangs: {
              orderBy: { thuTu: 'asc' },
              include: {
                luaChon: true
              }
            }
          }
        },
        thanhVien: {
          include: {
            nguoiDung: true,
            CAUTRALOI: {
              include: {
                luaChon: true
              }
            }
          }
        }
      }
    });
  }

  // Get session by ID
  async getPhienById(maPhien: string) {
    return prisma.pHIENTRINHCHIEU.findUnique({
      where: { maPhien },
      include: {
        phong: {
          include: {
            kenh: true,
            trangs: {
              orderBy: { thuTu: 'asc' },
              include: {
                luaChon: true
              }
            }
          }
        },
        thanhVien: {
          include: {
            nguoiDung: true,
            CAUTRALOI: {
              include: {
                luaChon: true
              }
            }
          }
        }
      }
    });
  }

  // Check if user is member of channel
  async isUserChannelMember(maNguoiDung: string, maKenh: string) {
    const member = await prisma.tHANHVIENKENH.findUnique({
      where: {
        maNguoiDung_maKenh: {
          maNguoiDung,
          maKenh
        }
      }
    });

    return member && member.trangThai === 'THAM_GIA';
  }

  // Add member to session
  async addMemberToPhien(
    maPhien: string,
    tenThanhVien: string,
    maNguoiDung?: string,
    anhDaiDien?: string
  ) {
    // Check if user already in session
    if (maNguoiDung) {
      const existingMember = await prisma.tHANHVIENPHIENTRINHCHIEU.findUnique({
        where: {
          maPhien_maNguoiDung: {
            maPhien,
            maNguoiDung
          }
        }
      });

      if (existingMember) {
        return existingMember;
      }
    }

    return prisma.tHANHVIENPHIENTRINHCHIEU.create({
      data: {
        maPhien,
        maNguoiDung,
        tenThanhVien,
        anhDaiDien,
        vaiTro: VaiTroPhien.THANH_VIEN
      },
      include: {
        nguoiDung: true
      }
    });
  }

  // Remove member from session
  async removeMemberFromPhien(maThanhVienPhien: string) {
    return prisma.tHANHVIENPHIENTRINHCHIEU.delete({
      where: { maThanhVienPhien }
    });
  }

  // Update member score
  async updateMemberScore(maThanhVienPhien: string, diemCong: number) {
    return prisma.tHANHVIENPHIENTRINHCHIEU.update({
      where: { maThanhVienPhien },
      data: {
        tongDiem: {
          increment: diemCong
        }
      }
    });
  }

  // Submit answer
  async submitAnswer(maThanhVienPhien: string, maLuaChon: string, thoiGian: number) {
    return await prisma.cAUTRALOI.create({
      data: {
        maThanhVienPhien,
        maLuaChon,
        thoiGian
      },
      include: {
        luaChon: true
      }
    });
  }

  // Get leaderboard
  async getLeaderboard(maPhien: string) {
    return prisma.tHANHVIENPHIENTRINHCHIEU.findMany({
      where: { maPhien, vaiTro: VaiTroPhien.THANH_VIEN },
      orderBy: { tongDiem: 'desc' },
      include: {
        nguoiDung: {
          select: {
            hoTen: true,
            anhDaiDien: true
          }
        }
      }
    });
  }

  // Delete session
  async deletePhien(maPhien: string) {
    return prisma.pHIENTRINHCHIEU.delete({
      where: { maPhien }
    });
  }

  // Get active sessions by room
  async getActivePhienByRoom(maPhong: string) {
    return prisma.pHIENTRINHCHIEU.findFirst({
      where: {
        maPhong,
        ngayTao: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Sessions within last 24 hours
        }
      },
      orderBy: {
        ngayTao: 'desc'
      }
    });
  }

  // Check if user is session host
  async isSessionHost(maPhien: string, maNguoiDung: string) {
    const member = await prisma.tHANHVIENPHIENTRINHCHIEU.findUnique({
      where: {
        maPhien_maNguoiDung: {
          maPhien,
          maNguoiDung
        }
      }
    });

    return member?.vaiTro === VaiTroPhien.CHU_PHIEN;
  }
}

export default new PhienTrinhChieuRepository();
