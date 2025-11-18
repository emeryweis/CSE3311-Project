import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get all users (public for now, but usually protected in production)
router.get('/', optionalAuth, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, createdAt: true, admin: true },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params['id'] },
      select: { id: true, email: true, username: true, createdAt: true, admin: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update current user (authenticated only)
router.put('/me', authenticate, async (req: any, res, next) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body,
      select: { id: true, email: true, username: true, createdAt: true, admin: true },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Delete current user (authenticated only)
router.delete('/me', authenticate, async (req: any, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
