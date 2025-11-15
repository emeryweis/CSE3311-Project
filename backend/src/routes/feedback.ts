import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Public: Submit feedback (anyone can submit, even without login)
router.post('/', optionalAuth, async (req: any, res, next) => {
  try {
    const { rating, category, subject, message, email } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Create feedback
    // Note: If Feedback table doesn't exist yet, this will fail gracefully
    let feedback;
    try {
      feedback = await prisma.feedback.create({
        data: {
          rating: parseInt(rating, 10),
          category: category || 'general',
          subject: subject?.trim() || null,
          message: message.trim(),
          email: email?.trim() || null,
          userId: req.user?.id || null,
          status: 'new',
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist yet, return success anyway (migration pending)
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist')) {
        console.log('Feedback table not found - migration may be pending');
        return res.status(201).json({
          success: true,
          message: 'Thank you for your feedback! (Note: Database migration pending)',
          data: { rating, category, message: 'Feedback received but not saved yet' },
        });
      }
      throw dbError;
    }

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    next(error);
    return;
  }
});

// Protected: Get all feedback (admin only - for now, anyone authenticated can view)
router.get('/', authenticate, async (_req: any, res, next) => {
  try {
    let feedback;
    try {
      feedback = await prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist')) {
        return res.json({ success: true, data: [] });
      }
      throw dbError;
    }

    return res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
    return;
  }
});

// Protected: Get single feedback
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    let feedback;
    try {
      feedback = await prisma.feedback.findUnique({
        where: { id: req.params['id'] },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist yet, return 404
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Feedback table not found - migration pending',
        });
      }
      throw dbError;
    }

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    return res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
    return;
  }
});

// Protected: Update feedback status (admin)
router.patch('/:id', authenticate, async (req: any, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'read', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, read, resolved, or archived',
      });
    }

    let feedback;
    try {
      feedback = await prisma.feedback.update({
        where: { id: req.params['id'] },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist yet, return error
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Feedback table not found - migration pending',
        });
      }
      throw dbError;
    }

    return res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
    return;
  }
});

export default router;

