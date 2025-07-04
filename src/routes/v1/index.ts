// src/routes/v1/index.ts
import express from 'express';
import config from '../../config';
import authRoute from './auth.route';
import baoCaoRoute from './baoCao.route';
import docsRoute from './docs.route';
import kenhRoute from './kenh.route';
import phienTrinhChieuRoute from './phienTrinhChieu.route';
import phongRoute from './phong.route';
import userRoute from './user.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/kenh',
    route: kenhRoute
  },
  {
    path: '/phong',
    route: phongRoute
  },
  {
    path: '/phien',
    route: phienTrinhChieuRoute
  },
  {
    path: '/baocao',
    route: baoCaoRoute
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
