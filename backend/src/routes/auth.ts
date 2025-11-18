import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/middleware/auth';

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

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashed,
        firstName,
        lastName,
      },
    });

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        admin: user.admin,
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

    const token = jwt.sign(
      { id: user.id, email: user.email },
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
          admin: user.admin,
        },
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Login failed.' });
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
