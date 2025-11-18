import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Public routes
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const locationId = req.query['locationId'] as string | undefined;
    
    const where = locationId ? { locationId } : {};
    
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params['id'] },
      include: { user: true, location: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const { content, rating, locationId } = req.body;

    const newReview = await prisma.review.create({
      data: {
        content,
        rating,
        user: { connect: { id: req.user.id } },
        ...(locationId ? { location: { connect: { id: locationId } } } : {}),
      },
      include: { user: true, location: true },
    });

    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: any, res, next) => {
  try {
    const { content, rating } = req.body;

    const existingReview = await prisma.review.findUnique({
      where: { id: req.params['id'] },
    });
    if (!existingReview) {
      throw new Error('Review not found');
    }
    if (existingReview.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this review' });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id: req.params['id'] },
      data: { content, rating },
      include: { user: true, location: true },
    });

    res.json({ success: true, data: updatedReview });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: any, res, next) => {
  try {
    const existingReview = await prisma.review.findUnique({
      where: { id: req.params['id'] },
    });
    if (!existingReview) {
      throw new Error('Review not found');
    }
    if (existingReview.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
      return;
    }

    await prisma.review.delete({
      where: { id: req.params['id'] },
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
