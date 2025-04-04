import { Quyen as Role } from '@prisma/client';

const allRoles = {
  [Role.NGUOI_DUNG]: [],
  [Role.ADMIN]: ['getUsers', 'manageUsers']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
