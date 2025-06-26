// src/validations/baoCao.validation.ts
import Joi from 'joi';

const createBaoCao = {
  body: Joi.object().keys({
    maPhong: Joi.string().required().messages({
      'string.empty': 'Mã phòng không được để trống',
      'any.required': 'Mã phòng là bắt buộc'
    }),
    noiDung: Joi.string().required().min(10).max(1000).messages({
      'string.empty': 'Nội dung không được để trống',
      'string.min': 'Nội dung phải có ít nhất 10 ký tự',
      'string.max': 'Nội dung không được vượt quá 1000 ký tự',
      'any.required': 'Nội dung là bắt buộc'
    }),
    hinhAnh: Joi.string().optional().uri().messages({
      'string.uri': 'Hình ảnh phải là một URL hợp lệ'
    })
  })
};

const getBaoCaoList = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    trangThai: Joi.string().valid('CHUA_XU_LY', 'DA_XU_LY').optional(),
    search: Joi.string().optional().max(100)
  })
};

const getBaoCaoDetails = {
  params: Joi.object().keys({
    maBaoCao: Joi.string().required().messages({
      'string.empty': 'Mã báo cáo không được để trống',
      'any.required': 'Mã báo cáo là bắt buộc'
    })
  })
};

const updateTrangThaiBaoCao = {
  params: Joi.object().keys({
    maBaoCao: Joi.string().required().messages({
      'string.empty': 'Mã báo cáo không được để trống',
      'any.required': 'Mã báo cáo là bắt buộc'
    })
  }),
  body: Joi.object().keys({
    trangThai: Joi.string().valid('CHUA_XU_LY', 'DA_XU_LY').required().messages({
      'any.only': 'Trạng thái phải là CHUA_XU_LY hoặc DA_XU_LY',
      'any.required': 'Trạng thái là bắt buộc'
    })
  })
};

const deleteBaoCao = {
  params: Joi.object().keys({
    maBaoCao: Joi.string().required().messages({
      'string.empty': 'Mã báo cáo không được để trống',
      'any.required': 'Mã báo cáo là bắt buộc'
    })
  })
};

const getBaoCaoByPhong = {
  params: Joi.object().keys({
    maPhong: Joi.string().required().messages({
      'string.empty': 'Mã phòng không được để trống',
      'any.required': 'Mã phòng là bắt buộc'
    })
  })
};

export {
  createBaoCao,
  deleteBaoCao,
  getBaoCaoByPhong,
  getBaoCaoDetails,
  getBaoCaoList,
  updateTrangThaiBaoCao
};
