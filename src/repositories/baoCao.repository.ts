// src/repositories/baoCao.repository.ts
import { TrangThaiBaoCao } from '@prisma/client';
import prisma from '../client';

class BaoCaoRepository {
  // Create a new report
  async createBaoCao(maNguoiDung: string, maPhong: string, noiDung: string, hinhAnh?: string) {
    return prisma.bAOCAO.create({
      data: {
        maNguoiDung,
        maPhong,
        noiDung,
        hinhAnh
      },
      include: {
        nguoiDung: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
          }
        },
        phong: {
          select: {
            maPhong: true,
            tenPhong: true,
            moTa: true,
            maKenh: true,
            kenh: {
              select: {
                maKenh: true,
                tenKenh: true
              }
            }
          }
        }
      }
    });
  }

  // Get all reports with pagination and filtering
  async getBaoCaoList(
    page: number = 1,
    limit: number = 10,
    trangThai?: TrangThaiBaoCao,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      ngayXoa: null, // Only non-deleted reports
      ...(trangThai && { trangThai }),
      ...(search && {
        OR: [
          { noiDung: { contains: search, mode: 'insensitive' as const } },
          { phong: { tenPhong: { contains: search, mode: 'insensitive' as const } } },
          { nguoiDung: { hoTen: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    };

    const [reports, total] = await Promise.all([
      prisma.bAOCAO.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ngayTao: 'desc' },
        include: {
          nguoiDung: {
            select: {
              maNguoiDung: true,
              hoTen: true,
              email: true,
              anhDaiDien: true
            }
          },
          phong: {
            select: {
              maPhong: true,
              tenPhong: true,
              moTa: true,
              maKenh: true,
              kenh: {
                select: {
                  maKenh: true,
                  tenKenh: true
                }
              }
            }
          }
        }
      }),
      prisma.bAOCAO.count({ where })
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get report by ID
  async getBaoCaoById(maBaoCao: string) {
    return prisma.bAOCAO.findFirst({
      where: {
        maBaoCao,
        ngayXoa: null
      },
      include: {
        nguoiDung: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
          }
        },
        phong: {
          select: {
            maPhong: true,
            tenPhong: true,
            moTa: true,
            maKenh: true,
            maNguoiTao: true,
            kenh: {
              select: {
                maKenh: true,
                tenKenh: true
              }
            }
          }
        }
      }
    });
  }

  // Update report status
  async updateTrangThaiBaoCao(maBaoCao: string, trangThai: TrangThaiBaoCao) {
    return prisma.bAOCAO.update({
      where: { maBaoCao },
      data: { trangThai },
      include: {
        nguoiDung: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
          }
        },
        phong: {
          select: {
            maPhong: true,
            tenPhong: true,
            moTa: true,
            maKenh: true,
            kenh: {
              select: {
                maKenh: true,
                tenKenh: true
              }
            }
          }
        }
      }
    });
  }

  // Soft delete report
  async deleteBaoCao(maBaoCao: string) {
    return prisma.bAOCAO.update({
      where: { maBaoCao },
      data: { ngayXoa: new Date() }
    });
  }

  // Check if user already reported this room
  async checkExistingReport(maNguoiDung: string, maPhong: string) {
    return prisma.bAOCAO.findFirst({
      where: {
        maNguoiDung,
        maPhong,
        ngayXoa: null
      }
    });
  }

  // Get reports by room ID
  async getBaoCaoByPhong(maPhong: string) {
    return prisma.bAOCAO.findMany({
      where: {
        maPhong,
        ngayXoa: null
      },
      include: {
        nguoiDung: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            anhDaiDien: true
          }
        }
      },
      orderBy: { ngayTao: 'desc' }
    });
  }

  // Get report statistics
  async getBaoCaoStats() {
    const [total, chuaXuLy, daXuLy] = await Promise.all([
      prisma.bAOCAO.count({
        where: { ngayXoa: null }
      }),
      prisma.bAOCAO.count({
        where: {
          ngayXoa: null,
          trangThai: TrangThaiBaoCao.CHUA_XU_LY
        }
      }),
      prisma.bAOCAO.count({
        where: {
          ngayXoa: null,
          trangThai: TrangThaiBaoCao.DA_XU_LY
        }
      })
    ]);

    return {
      total,
      chuaXuLy,
      daXuLy
    };
  }
}

export default new BaoCaoRepository();
