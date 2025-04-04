import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = 'Reset Password';
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const html = `
    <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
      </head>
      <body style="font-family: 'Roboto', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 32rem; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
              <h1 style="font-size: 1.5rem; font-weight: 700; color: #2d3748; margin-bottom: 16px;">Password Reset Request</h1>
              <p style="color: #4a5568; margin-bottom: 16px;">Hello,</p>
              <p style="color: #4a5568; margin-bottom: 16px;">We received a request to reset your password. Please use the code below to reset it:</p>
              <div style="background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; border-radius: 0.5rem; padding: 12px; font-weight: 700; text-align: center; margin-bottom: 16px;word-break: break-word;">${token}</div>
              <p style="color: #4a5568; margin-bottom: 16px;">Or you can click the button below to reset your password:</p>
              <div style="text-align: center; margin-bottom: 16px;">
                  <a href="${resetPasswordUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 0.5rem; text-decoration: none; font-weight: 700;">Reset Password</a>
              </div>
              <p style="color: #4a5568; margin-bottom: 16px;">If you did not request a password reset, please ignore this email.</p>
              <p style="color: #4a5568; margin-bottom: 16px;">Thank you,</p>
              <p style="color: #4a5568; margin-bottom: 16px;">Slooh</p>
          </div>
          <div style="text-align: center; color: #a0aec0; font-size: 0.875rem; margin-top: 24px;">
              <p>&copy; 2025 Slooh. All rights reserved.</p>
          </div>
      </body>
    </html>`;

  await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const html = `
    <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
      </head>
      <body style="font-family: 'Roboto', sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 32rem; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
              <h1 style="font-size: 1.5rem; font-weight: 700; color: #2d3748; margin-bottom: 16px;">Email Verification</h1>
              <p style="color: #4a5568; margin-bottom: 16px;">Hello,</p>
              <p style="color: #4a5568; margin-bottom: 16px;">Thank you for signing up! Please use the verification code below to verify your email:</p>
              <div style="background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; border-radius: 0.5rem; padding: 12px; font-weight: 700; text-align: center; margin-bottom: 16px;word-break: break-word;">${token}</div>
              <p style="color: #4a5568; margin-bottom: 16px;">Or you can click the button below to verify your email:</p>
              <div style="text-align: center; margin-bottom: 16px;">
                  <a href="${verificationEmailUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 0.5rem; text-decoration: none; font-weight: 700;">Verify Email</a>
              </div>
              <p style="color: #4a5568; margin-bottom: 16px;">If you did not sign up, please ignore this email.</p>
              <p style="color: #4a5568; margin-bottom: 16px;">Thank you,</p>
              <p style="color: #4a5568; margin-bottom: 16px;">Slooh</p>
          </div>
          <div style="text-align: center; color: #a0aec0; font-size: 0.875rem; margin-top: 24px;">
              <p>&copy; 2025 Slooh. All rights reserved.</p>
          </div>
      </body>
    </html>`;

  await sendEmail(to, subject, html);
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail
};
