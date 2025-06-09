// src/middlewares/validateUpdatePhong.ts

import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

// Joi schema để kiểm tra dữ liệu cập nhật phòng
const updatePhongSchema = Joi.object({
  tenPhong: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Tên phòng là bắt buộc',
    'string.min': 'Tên phòng phải có ít nhất 1 ký tự',
    'string.max': 'Tên phòng không được vượt quá 200 ký tự',
    'any.required': 'Tên phòng là bắt buộc'
  }),

  moTa: Joi.string().allow(null, '').max(1000).messages({
    'string.max': 'Mô tả không được vượt quá 1000 ký tự'
  }),

  trangThai: Joi.string().valid('HOAT_DONG', 'KHOA').required().messages({
    'any.only': 'Trạng thái phải là HOAT_DONG hoặc KHOA',
    'any.required': 'Trạng thái là bắt buộc'
  }),

  hoatDong: Joi.string().valid('OFFLINE', 'WAITING', 'PRESENTING').required().messages({
    'any.only': 'Trạng thái hoạt động phải là OFFLINE, WAITING hoặc PRESENTING',
    'any.required': 'Trạng thái hoạt động là bắt buộc'
  }),

  danhSachTrang: Joi.array()
    .items(
      Joi.object({
        loaiTrang: Joi.string().valid('NOI_DUNG', 'CAU_HOI').required().messages({
          'any.only': 'Loại trang phải là NOI_DUNG hoặc CAU_HOI',
          'any.required': 'Loại trang là bắt buộc'
        }),

        tieuDe: Joi.string().trim().min(1).max(300).required().messages({
          'string.empty': 'Tiêu đề trang là bắt buộc',
          'string.min': 'Tiêu đề trang phải có ít nhất 1 ký tự',
          'string.max': 'Tiêu đề trang không được vượt quá 300 ký tự',
          'any.required': 'Tiêu đề trang là bắt buộc'
        }),

        hinhAnh: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Hình ảnh phải là một đường dẫn hợp lệ'
        }),

        video: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Video phải là một đường dẫn hợp lệ'
        }),

        hinhNen: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Hình nền phải là một đường dẫn hợp lệ'
        }),

        cachTrinhBay: Joi.string().allow(null),

        canLeTieuDe: Joi.string().allow(null, '').max(500).messages({
          'string.max': 'Căn lề tiêu đề không được vượt quá 500 ký tự'
        }),

        canLeNoiDung: Joi.string().allow(null, '').max(500).messages({
          'string.max': 'Căn lề nội dung không được vượt quá 500 ký tự'
        }),

        noiDung: Joi.string().allow(null, '').max(5000).messages({
          'string.max': 'Nội dung không được vượt quá 5000 ký tự'
        }),

        thoiGianGioiHan: Joi.number().integer().min(5).max(300).allow(null).messages({
          'number.base': 'Thời gian giới hạn phải là một số',
          'number.integer': 'Thời gian giới hạn phải là số nguyên',
          'number.min': 'Thời gian giới hạn phải ít nhất là 5 giây',
          'number.max': 'Thời gian giới hạn không được vượt quá 300 giây'
        }),

        diem: Joi.string().valid('BINH_THUONG', 'GAP_DOI', 'KHONG_DIEM').default('BINH_THUONG'),

        loaiCauTraLoi: Joi.string()
          .valid('SINGLE_SELECT', 'MULTI_SELECT', 'TRUE_FALSE')
          .allow(null),

        danhSachLuaChon: Joi.array()
          .items(
            Joi.object({
              noiDung: Joi.string().trim().min(1).max(500).required().messages({
                'string.empty': 'Nội dung lựa chọn là bắt buộc',
                'string.min': 'Nội dung lựa chọn phải có ít nhất 1 ký tự',
                'string.max': 'Nội dung lựa chọn không được vượt quá 500 ký tự',
                'any.required': 'Nội dung lựa chọn là bắt buộc'
              }),

              ketQua: Joi.boolean().default(false)
            })
          )
          .default([])
      })
    )
    .default([])
});

// Kiểm tra các quy tắc nghiệp vụ tùy chỉnh
const validateBusinessRules = (data: any): string | null => {
  if (!data.danhSachTrang || data.danhSachTrang.length === 0) {
    return null; // Cho phép phòng không có trang
  }

  for (let i = 0; i < data.danhSachTrang.length; i++) {
    const trang = data.danhSachTrang[i];

    if (trang.loaiTrang === 'CAU_HOI') {
      if (!trang.danhSachLuaChon || trang.danhSachLuaChon.length === 0) {
        return `Trang ${i + 1}: Trang câu hỏi phải có ít nhất một lựa chọn`;
      }

      if (trang.danhSachLuaChon.length < 2) {
        return `Trang ${i + 1}: Trang câu hỏi phải có ít nhất 2 lựa chọn`;
      }

      if (trang.danhSachLuaChon.length > 10) {
        return `Trang ${i + 1}: Trang câu hỏi không được có quá 10 lựa chọn`;
      }

      const hasCorrectAnswer = trang.danhSachLuaChon.some((choice: any) => choice.ketQua === true);
      if (!hasCorrectAnswer) {
        return `Trang ${i + 1}: Phải có ít nhất một lựa chọn đúng`;
      }

      if (trang.loaiCauTraLoi === 'SINGLE_SELECT') {
        const correctChoices = trang.danhSachLuaChon.filter(
          (choice: any) => choice.ketQua === true
        );
        if (correctChoices.length > 1) {
          return `Trang ${i + 1}: Câu hỏi chọn một chỉ được có một đáp án đúng`;
        }
      }

      if (trang.loaiCauTraLoi === 'TRUE_FALSE') {
        if (trang.danhSachLuaChon.length !== 2) {
          return `Trang ${i + 1}: Câu hỏi đúng/sai phải có đúng 2 lựa chọn`;
        }
      }

      if (!trang.loaiCauTraLoi) {
        return `Trang ${i + 1}: Phải chọn loại câu trả lời cho trang câu hỏi`;
      }
    } else {
      if (trang.danhSachLuaChon && trang.danhSachLuaChon.length > 0) {
        return `Trang ${i + 1}: Trang nội dung không được chứa lựa chọn`;
      }
    }
  }

  return null;
};

// Middleware
const validateUpdatePhong = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updatePhongSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join('; ');
    res.status(400).json({
      statusCode: 400,
      success: false,
      message: errorMessage,
      data: null
    });
    return;
  }

  const businessRuleError = validateBusinessRules(value);
  if (businessRuleError) {
    res.status(400).json({
      statusCode: 400,
      success: false,
      message: businessRuleError,
      data: null
    });
    return;
  }

  req.body = value;
  next();
};

export default validateUpdatePhong;
