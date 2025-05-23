import { LuaChon } from './LuaChon.interface';

export interface Trang {
  maTrang: string;
  loaiTrang: string;
  tieuDe?: string;
  hinhAnh?: string;
  video?: string;
  hinhNen?: string;
  noiDung?: string;
  thoiGianGioiHan?: number;
  diem?: number;
  loaiCauTraLoi?: string;
  danhSachLuaChon?: LuaChon[];
}
