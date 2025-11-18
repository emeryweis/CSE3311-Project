import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// 🔍 Search locations
router.get('/locations', optionalAuth, async (req, res, next) => {
  try {
    const q = (req.query['q'] as string) || '';
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const limit = parseInt((req.query['limit'] as string) || '50', 10);
    const skip = (page - 1) * limit;

    let where: Prisma.LocationWhereInput | undefined = undefined;

    if (q.trim()) {
      where = {
        isActive: true,
        verified: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
          { city: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
          { state: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      };
    } else {
      where = { isActive: true, verified: true };
    }

    const [results, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          costPerNight: true,
          rating: true,
          images: true,
          city: true,
          state: true,
        },
      }),
      prisma.location.count({ where }),
    ]);

    // Format results to match frontend expectations
    const formatted = results.map((loc) => {
      const imageArray = Array.isArray(loc.images) ? (loc.images as string[]) : [];
      const firstImage = imageArray[0];

      return {
        id: loc.id,
        name: loc.name,
        blurb: loc.description || 'No description available.',
        price: loc.costPerNight ? `$${loc.costPerNight}/night` : '—',
        rating: loc.rating?.toFixed(1) || '—',
        img: firstImage || 'https://via.placeholder.com/600x400?text=No+Image',
        location: [loc.city, loc.state].filter(Boolean).join(', ') || '',
      };
    });

    return res.json({
      success: true,
      data: formatted,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    // Handle database connection errors gracefully
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      console.error('Database connection error:', error.message);
      // Return empty results instead of 500 error
      return res.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
      });
    }
    // For other errors, use the error handler
    next(error);
    return;
  }
});

export default router;
