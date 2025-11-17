import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin, optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();
const router = Router();

console.log("✅ locations router loaded");

// ✅ Create a new location
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const newLocation = await prisma.location.create({ data: req.body });
    return res.status(201).json({ success: true, data: newLocation });
  } catch (error) {
    next(error);
    return;
  }
});

// ✅ Public: Recommended locations (only 3)
router.get('/recommended', optionalAuth, async (_req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true, verified: true },
      orderBy: { rating: 'desc' },
      take: 3,
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
    });

    const formatted = locations.map((loc) => {
      const imageArray = Array.isArray(loc.images) ? (loc.images as string[]) : [];
      const firstImage = imageArray[0];

      return {
        id: loc.id,
        name: loc.name,
        blurb: loc.description || 'No description available.',
        price: loc.costPerNight ? `$${loc.costPerNight}/night` : '—',
        rating: loc.rating?.toFixed(1) || '—',
        img: firstImage || 'https://via.placeholder.com/600x400?text=No+Image',
        location: [loc.city, loc.state].filter(Boolean).join(', '),
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
    return;
  }
});

// ✅ All locations
router.get('/all', optionalAuth, async (_req, res, next) => {
  try {
    const locations = await prisma.location.findMany();
    return res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
    return;
  }
});


// ✅ Single location by ID
router.get('/id/:id', optionalAuth, async (req, res, next) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    return res.json({ success: true, data: location });
  } catch (error) {
    next(error);
    return;
  }
});

// ✅ Update a location
router.put('/id/:id', async (req, res, next) => {
  try {
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json({ success: true, data: location });
  } catch (error) {
    next(error);
    return;
  }
});

// ✅ Delete a location
router.delete('/id/:id', async (req, res, next) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
