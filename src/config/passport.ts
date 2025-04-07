import prisma from '../client';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback, Strategy } from 'passport-jwt';
import config from './config';
import { LoaiToken as TokenType } from '@prisma/client';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authService } from '../services';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const googleOptions = {
  clientID: config.google.clientId as string,
  clientSecret: config.google.clientSecret as string,
  callbackURL: config.google.callbackUrl as string
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await prisma.nGUOIDUNG.findUnique({
      select: {
        maNguoiDung: true,
        email: true,
        hoTen: true
      },
      where: { maNguoiDung: payload.sub }
    });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};
const googleVerify = async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    const user = await authService.findOrCreateUser(accessToken, profile);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
export const googleStrategy = new GoogleStrategy(googleOptions, googleVerify);
