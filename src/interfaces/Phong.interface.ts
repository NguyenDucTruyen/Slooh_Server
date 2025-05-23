import { Trang } from './Trang.interface';

// declare Phong interface
export interface Phong {
  maPhong: string;
  tenPhong: string;
  moTa?: string;
  danhSachTrang?: Trang[];
  maKenh: string;
  trangThai: string;
  hoatDong: string;
  ngayTao: Date;
}
