// src/middlewares/validateUpdatePhong.ts

import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

// Joi validation schema for update phong
const updatePhongSchema = Joi.object({
  tenPhong: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Room name is required',
    'string.min': 'Room name must be at least 1 character',
    'string.max': 'Room name must not exceed 200 characters',
    'any.required': 'Room name is required'
  }),

  moTa: Joi.string().allow(null, '').max(1000).messages({
    'string.max': 'Description must not exceed 1000 characters'
  }),

  trangThai: Joi.string().valid('HOAT_DONG', 'KHOA').required().messages({
    'any.only': 'Status must be either HOAT_DONG or KHOA',
    'any.required': 'Status is required'
  }),

  hoatDong: Joi.string().valid('OFFLINE', 'WAITING', 'PRESENTING').required().messages({
    'any.only': 'Activity status must be OFFLINE, WAITING, or PRESENTING',
    'any.required': 'Activity status is required'
  }),

  danhSachTrang: Joi.array()
    .items(
      Joi.object({
        loaiTrang: Joi.string().valid('NOI_DUNG', 'CAU_HOI').required().messages({
          'any.only': 'Page type must be NOI_DUNG or CAU_HOI',
          'any.required': 'Page type is required'
        }),

        tieuDe: Joi.string().trim().min(1).max(300).required().messages({
          'string.empty': 'Page title is required',
          'string.min': 'Page title must be at least 1 character',
          'string.max': 'Page title must not exceed 300 characters',
          'any.required': 'Page title is required'
        }),

        hinhAnh: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Image must be a valid URL'
        }),

        video: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Video must be a valid URL'
        }),

        hinhNen: Joi.string().uri().allow(null, '').messages({
          'string.uri': 'Background image must be a valid URL'
        }),

        cachTrinhBay: Joi.string().allow(null),

        noiDung: Joi.string().allow(null, '').max(5000).messages({
          'string.max': 'Content must not exceed 5000 characters'
        }),

        thoiGianGioiHan: Joi.number().integer().min(5).max(300).allow(null).messages({
          'number.base': 'Time limit must be a number',
          'number.integer': 'Time limit must be an integer',
          'number.min': 'Time limit must be at least 5 seconds',
          'number.max': 'Time limit must not exceed 300 seconds'
        }),

        diem: Joi.string().valid('BINH_THUONG', 'GAP_DOI', 'KHONG_DIEM').default('BINH_THUONG'),

        loaiCauTraLoi: Joi.string()
          .valid('SINGLE_SELECT', 'MULTI_SELECT', 'TRUE_FALSE')
          .allow(null),

        danhSachLuaChon: Joi.array()
          .items(
            Joi.object({
              noiDung: Joi.string().trim().min(1).max(500).required().messages({
                'string.empty': 'Choice content is required',
                'string.min': 'Choice content must be at least 1 character',
                'string.max': 'Choice content must not exceed 500 characters',
                'any.required': 'Choice content is required'
              }),

              ketQua: Joi.boolean().default(false)
            })
          )
          .default([])
      })
    )
    .default([])
});

// Custom validation for business rules
const validateBusinessRules = (data: any): string | null => {
  if (!data.danhSachTrang || data.danhSachTrang.length === 0) {
    return null; // Empty pages are allowed
  }

  for (let i = 0; i < data.danhSachTrang.length; i++) {
    const trang = data.danhSachTrang[i];

    // Question pages must have choices
    if (trang.loaiTrang === 'CAU_HOI') {
      if (!trang.danhSachLuaChon || trang.danhSachLuaChon.length === 0) {
        return `Page ${i + 1}: Question pages must have at least one choice`;
      }

      if (trang.danhSachLuaChon.length < 2) {
        return `Page ${i + 1}: Question pages must have at least 2 choices`;
      }

      if (trang.danhSachLuaChon.length > 10) {
        return `Page ${i + 1}: Question pages cannot have more than 10 choices`;
      }

      // At least one choice must be correct
      const hasCorrectAnswer = trang.danhSachLuaChon.some((choice: any) => choice.ketQua === true);
      if (!hasCorrectAnswer) {
        return `Page ${i + 1}: At least one choice must be marked as correct`;
      }

      // For single select, only one choice should be correct
      if (trang.loaiCauTraLoi === 'SINGLE_SELECT') {
        const correctChoices = trang.danhSachLuaChon.filter(
          (choice: any) => choice.ketQua === true
        );
        if (correctChoices.length > 1) {
          return `Page ${i + 1}: Single select questions can only have one correct answer`;
        }
      }

      // For true/false, must have exactly 2 choices
      if (trang.loaiCauTraLoi === 'TRUE_FALSE') {
        if (trang.danhSachLuaChon.length !== 2) {
          return `Page ${i + 1}: True/False questions must have exactly 2 choices`;
        }
      }

      // Question type is required for question pages
      if (!trang.loaiCauTraLoi) {
        return `Page ${i + 1}: Question type is required for question pages`;
      }
    } else {
      // Content pages should not have choices
      if (trang.danhSachLuaChon && trang.danhSachLuaChon.length > 0) {
        return `Page ${i + 1}: Content pages should not have choices`;
      }
    }
  }

  return null;
};

// Middleware function
const validateUpdatePhong = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updatePhongSchema.validate(req.body, {
    abortEarly: false, // Show all validation errors
    stripUnknown: true // Remove unknown fields
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

  // Custom business rules validation
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

  // Set validated data back to request body
  req.body = value;
  next();
};

export default validateUpdatePhong;
