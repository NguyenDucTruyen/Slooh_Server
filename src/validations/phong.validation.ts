import { TrangThai } from '@prisma/client';
import Joi from 'joi';

const updateRoomStatus = {
  params: Joi.object().keys({
    maPhong: Joi.string().required().messages({
      'any.required': 'Mã phòng là bắt buộc'
    })
  }),
  body: Joi.object().keys({
    trangThai: Joi.string().valid(TrangThai.HOAT_DONG, TrangThai.KHOA).required().messages({
      'any.only': 'Trạng thái phải là HOAT_DONG hoặc KHOA',
      'any.required': 'Trạng thái là bắt buộc'
    })
  })
};

const getAllRooms = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
};

const getAllRoomsInChannel = {
  params: Joi.object().keys({
    maKenh: Joi.string().required().messages({
      'any.required': 'Mã kênh là bắt buộc'
    })
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
};

const getAllPublicRooms = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
};

export default {
  updateRoomStatus,
  getAllRooms,
  getAllRoomsInChannel,
  getAllPublicRooms
};
