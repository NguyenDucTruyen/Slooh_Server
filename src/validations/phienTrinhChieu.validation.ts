import Joi from 'joi';

const createPhien = {
  body: Joi.object().keys({
    maPhong: Joi.string().required().messages({
      'any.required': 'Mã phòng là bắt buộc',
      'string.empty': 'Mã phòng không được để trống'
    })
  })
};

const getPhienById = {
  params: Joi.object().keys({
    maPhien: Joi.string().required().messages({
      'any.required': 'Mã phiên là bắt buộc',
      'string.empty': 'Mã phiên không được để trống'
    })
  })
};

const getPhienByPin = {
  params: Joi.object().keys({
    maPin: Joi.string().required().messages({
      'any.required': 'Mã PIN là bắt buộc',
      'string.empty': 'Mã PIN không được để trống'
    })
  })
};

const getPinByRoomId = {
  params: Joi.object().keys({
    maPhong: Joi.string().required().messages({
      'any.required': 'Mã phòng là bắt buộc',
      'string.empty': 'Mã phòng không được để trống'
    })
  })
};

export default {
  createPhien,
  getPhienById,
  getPhienByPin,
  getPinByRoomId
};
