import crypto from 'crypto';
import { userRepository, UserEntity } from '@repositories/UserRepository';
import { hashPassword, verifyPassword, generateUserToken, verifyGoogleToken } from '@utils/auth';
import { emailService } from '@services/EmailService';
import { AppError } from '@/errors/appError';
import { config } from '@/config';

export class UserService {
  private sanitizeUser(user: UserEntity) {
    const { password_hash, verification_token, reset_password_token, ...safeUser } = user;
    return safeUser;
  }

  async signup(data: { name: string; email: string; password?: string }, lang: 'hi' | 'en' = 'en') {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    if (!name || name.length < 2) {
      throw new AppError(
        lang === 'hi'
          ? 'कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।'
          : 'Please enter your full name (at least 2 characters).',
        400
      );
    }

    if (!email || !email.includes('@')) {
      throw new AppError(
        lang === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.',
        400
      );
    }

    if (!data.password || data.password.length < 6) {
      throw new AppError(
        lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.',
        400
      );
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError(
        lang === 'hi'
          ? 'इस ईमेल पते से खाता पहले से मौजूद है। कृपया लॉग इन करें।'
          : 'An account with this email address already exists. Please sign in.',
        409
      );
    }

    const passwordHash = hashPassword(data.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await userRepository.create({
      name,
      email,
      password_hash: passwordHash,
      is_verified: true, // Auto-verified for frictionless onboarding
      verification_token: verificationToken
    });

    // Send beautiful devotional welcome email asynchronously
    emailService
      .sendWelcomeEmail({
        name: newUser.name,
        email: newUser.email,
        verificationUrl: 'https://aradhnamarg.com/bhajans'
      })
      .catch(() => {});

    const token = generateUserToken(newUser);
    return {
      token,
      user: this.sanitizeUser(newUser)
    };
  }

  async login(data: { email: string; password?: string }, lang: 'hi' | 'en' = 'en') {
    const email = data.email.trim().toLowerCase();

    if (!email || !data.password) {
      throw new AppError(
        lang === 'hi' ? 'ईमेल और पासवर्ड दोनों आवश्यक हैं।' : 'Both email and password are required.',
        400
      );
    }

    const user = await userRepository.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new AppError(
        lang === 'hi' ? 'गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।' : 'Invalid email or password. Please try again.',
        401
      );
    }

    const isValid = verifyPassword(data.password, user.password_hash);
    if (!isValid) {
      throw new AppError(
        lang === 'hi' ? 'गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।' : 'Invalid email or password. Please try again.',
        401
      );
    }

    if (user.is_active === false) {
      throw new AppError(
        lang === 'hi'
          ? 'आपका खाता निष्क्रिय कर दिया गया है। कृपया सहायता से संपर्क करें।'
          : 'Your account has been deactivated. Please contact support.',
        403
      );
    }

    await userRepository.updateLastLogin(user.id);

    const token = generateUserToken(user);
    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Google OAuth for public user authentication.
   * Strict Rule: Mode 'login' rejects users who haven't signed up yet.
   */
  async googleAuth(idToken: string, mode: 'login' | 'signup' = 'login', lang: 'hi' | 'en' = 'en') {
    if (!idToken) {
      throw new AppError(
        lang === 'hi' ? 'Google प्रमाणीकरण विवरण आवश्यक है।' : 'Google authentication credential is required.',
        400
      );
    }

    const googleUser = await verifyGoogleToken(idToken);
    let user = await userRepository.findByEmail(googleUser.email);

    if (mode === 'login') {
      if (!user) {
        throw new AppError(
          lang === 'hi'
            ? 'इस Google ईमेल से कोई खाता पंजीकृत नहीं है। कृपया पहले "साइन अप" करें।'
            : 'No registered account found with this Google email. Please "Sign Up" first.',
          404
        );
      }

      if (user.is_active === false) {
        throw new AppError(
          lang === 'hi'
            ? 'आपका खाता निष्क्रिय कर दिया गया है। कृपया सहायता से संपर्क करें।'
            : 'Your account has been deactivated. Please contact support.',
          403
        );
      }

      // Link google_id if user originally created with email/password
      if (!user.google_id || !user.avatar_url) {
        user = await userRepository.updateGoogleId(user.id, googleUser.sub, googleUser.picture);
      }
    } else {
      // mode === 'signup'
      if (!user) {
        user = await userRepository.create({
          name: googleUser.name,
          email: googleUser.email,
          google_id: googleUser.sub,
          avatar_url: googleUser.picture,
          is_verified: true
        });

        // Send welcome email on new Google sign up
        emailService
          .sendWelcomeEmail({
            name: user.name,
            email: user.email,
            verificationUrl: 'https://aradhnamarg.com/bhajans'
          })
          .catch(() => {});
      } else {
        if (user.is_active === false) {
          throw new AppError(
            lang === 'hi'
              ? 'आपका खाता निष्क्रिय कर दिया गया है। कृपया सहायता से संपर्क करें।'
              : 'Your account has been deactivated. Please contact support.',
            403
          );
        }
        if (!user.google_id) {
          user = await userRepository.updateGoogleId(user.id, googleUser.sub, googleUser.picture);
        }
      }
    }

    await userRepository.updateLastLogin(user.id);

    const token = generateUserToken(user);
    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * 15-Minute Timeline Password Reset Request
   */
  async forgotPassword(email: string, lang: 'hi' | 'en' = 'en') {
    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);

    // Security best practice: Always return success message even if user not found to prevent user enumeration
    if (!user) {
      return {
        success: true,
        message:
          lang === 'hi'
            ? 'यदि यह ईमेल पंजीकृत है, तो पासवर्ड रीसेट लिंक भेज दिया गया है।'
            : 'If this email is registered, a password reset link has been dispatched.'
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    // Strict 15 minutes expiration timeline
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await userRepository.setResetPasswordToken(user.id, resetToken, expiresAt);

    const publicBase = 'https://aradhnamarg.com';
    const resetUrl = `${publicBase}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl,
      expiresMinutes: 15
    });

    return {
      success: true,
      message:
        lang === 'hi'
          ? '15 मिनट के लिए मान्य पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।'
          : 'A password reset link valid strictly for 15 minutes has been sent to your email.'
    };
  }

  async resetPassword(token: string, newPassword?: string, lang: 'hi' | 'en' = 'en') {
    if (!token || !newPassword || newPassword.length < 6) {
      throw new AppError(
        lang === 'hi'
          ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'New password must be at least 6 characters long.',
        400
      );
    }

    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError(
        lang === 'hi'
          ? 'पासवर्ड रीसेट लिंक अमान्य है या 15 मिनट की समय-सीमा समाप्त हो चुकी है।'
          : 'Password reset link is invalid or the 15-minute validity timeline has expired.',
        400
      );
    }

    const passwordHash = hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);

    // Send confirmation security alert
    emailService
      .sendPasswordChangedEmail({
        name: user.name,
        email: user.email
      })
      .catch(() => {});

    return {
      success: true,
      message:
        lang === 'hi'
          ? 'आपका पासवर्ड सफलतापूर्वक बदल दिया गया है। अब आप नए पासवर्ड से लॉग इन कर सकते हैं।'
          : 'Your password has been successfully reset. You can now sign in with your new password.'
    };
  }

  async getProfile(userId: string, lang: 'hi' | 'en' = 'en') {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(lang === 'hi' ? 'उपयोगकर्ता नहीं मिला।' : 'User not found.', 404);
    }
    return this.sanitizeUser(user);
  }
}

export const userService = new UserService();
