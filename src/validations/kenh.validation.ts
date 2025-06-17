import { TrangThai } from '@prisma/client';
import Joi from 'joi';

const updateChannelStatus = {
  params: Joi.object().keys({
    maKenh: Joi.string().required().messages({
      'any.required': 'Mã kênh là bắt buộc'
    })
  }),
  body: Joi.object().keys({
    trangThai: Joi.string().valid(TrangThai.HOAT_DONG, TrangThai.KHOA).required().messages({
      'any.only': 'Trạng thái phải là HOAT_DONG hoặc KHOA',
      'any.required': 'Trạng thái là bắt buộc'
    })
  })
};

const getAllChannels = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
};

export default {
  updateChannelStatus,
  getAllChannels
};
