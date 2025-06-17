import { Quyen as Role, TrangThai as Status } from '@prisma/client';
import Joi from 'joi';
import { password } from './custom.validation';

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid(Role.NGUOI_DUNG, Role.ADMIN)
  })
};

const getUsers = {
  query: Joi.object().keys({
    hoTen: Joi.string().allow(null, ''),
    quyen: Joi.string().allow(null, ''),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.number().integer()
  })
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      hoTen: Joi.string(),
      anhDaiDien: Joi.string().uri().allow(null, '').messages({
        'string.uri': 'Ảnh đại diện phải là URL hợp lệ'
      })
    })
    .min(1)
};

const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
    newPassword: Joi.string().required().custom(password).messages({
      'any.required': 'Mật khẩu mới là bắt buộc'
    })
  })
};

const updateUserStatus = {
  params: Joi.object().keys({
    userId: Joi.string().required()
  }),
  body: Joi.object().keys({
    trangThai: Joi.string().valid(Status.HOAT_DONG, Status.KHOA).required().messages({
      'any.only': 'Trạng thái phải là HOAT_DONG hoặc KHOA',
      'any.required': 'Trạng thái là bắt buộc'
    })
  })
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.number().integer()
  })
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  updateUserStatus
};
