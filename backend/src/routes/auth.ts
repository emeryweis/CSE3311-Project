import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/middleware/auth';
import { sendVerificationEmail, generateVerificationCode } from '@/services/emailService';

const prisma = new PrismaClient();
const router = Router();

// ✅ Register
router.post('/register', async (req, res) => {
  const { email, username, password, firstName, lastName } = req.body;

  if (!email.endsWith('@mavs.uta.edu')) {
    return res.status(400).json({ success: false, message: 'Must use a @mavs.uta.edu email.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24); // 24 hours expiry

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashed,
        firstName,
        lastName,
        emailVerified: false,
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Send verification email (don't block registration if email fails in development)
    try {
      await sendVerificationEmail(email, verificationCode, username || firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - code is still stored in database
    }

    return res.json({
      success: true,
      message: 'Registration successful! Please check your email for a verification code.',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email.endsWith('@mavs.uta.edu')) {
    return res.status(400).json({ success: false, message: 'Must use a @mavs.uta.edu email.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Check if verification code is still valid
      const codeExpired = user.verificationCodeExpiry 
        ? new Date() > user.verificationCodeExpiry 
        : true;
      
      if (codeExpired) {
        // Generate a new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date();
        verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationCode,
            verificationCodeExpiry,
          },
        });

        // Resend verification email
        try {
          await sendVerificationEmail(email, verificationCode, user.username || user.firstName || undefined);
        } catch (emailError) {
          console.error('Failed to resend verification email:', emailError);
        }
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in. A new verification code has been sent to your email.',
        requiresVerification: true,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },  // Include isAdmin
      process.env['JWT_SECRET'] as string,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        },
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
});


// ✅ Verify Email with Code
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    // Check if verification code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Check if code has expired
    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark email as verified and clear verification code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      data: {
        id: user.id,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
});

// ✅ Resend Verification Code
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  if (!email.endsWith('@mavs.uta.edu')) {
    return res.status(400).json({ success: false, message: 'Must use a @mavs.uta.edu email.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, user.username || user.firstName || undefined);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
    }

    return res.json({
      success: true,
      message: 'Verification code has been resent to your email.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
});

// Verify token (for debugging / checking auth)
router.get('/verify', authenticate, async (req: any, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
});


export default router;
