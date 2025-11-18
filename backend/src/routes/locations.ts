import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { searchCampingNearDFW, convertOSMToLocation, searchCampingNearCoordinates } from '@/services/openstreetmapApi';
import { fetchLocationImages } from '@/services/imageApi';

const prisma = new PrismaClient();
const router = Router();

console.log(" locations router loaded");

//  Create a new location
router.post('/', authenticate, async (req, res, next) => {
  try {
    const newLocation = await prisma.location.create({ data: req.body });
    return res.status(201).json({ success: true, data: newLocation });
  } catch (error) {
    next(error);
    return;
  }
});

//  Public: Recommended locations (only 3)
router.get('/recommended', optionalAuth, async (_req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true, verified: true },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }], // Fallback to createdAt if rating is null
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
  } catch (error: any) {
    // Handle database connection errors gracefully
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      console.error('Database connection error:', error.message);
      // Return empty array instead of 500 error
      return res.json({ success: true, data: [] });
    }
    // For other errors, use the error handler
    next(error);
    return;
  }
});

//  All locations (from database)
router.get('/all', optionalAuth, async (_req, res, next) => {
  try {
    // Add timeout to prevent hanging - limit to 1000 locations max
    const locations = await Promise.race([
      prisma.location.findMany({
        take: 1000, // Limit results to prevent huge responses
        orderBy: { createdAt: 'desc' },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      ),
    ]) as any[];
    return res.json({ success: true, data: locations });
  } catch (error: any) {
    // Handle database connection errors gracefully
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      console.error('Database connection error:', error.message);
      // Return empty array instead of 500 error
      return res.json({ success: true, data: [] });
    }
    // Handle query timeout
    if (error.message?.includes('Database query timeout')) {
      console.error('Database query timeout - returning empty array');
      return res.json({ success: true, data: [] });
    }
    // For other errors, use the error handler
    next(error);
    return;
  }
});

//  Fetch camping locations from OpenStreetMap around DFW
router.get('/osm/dfw', optionalAuth, async (req, res, next) => {
  try {
    const radiusKm = parseInt((req.query['radius'] as string) || '80', 10); // Default 80km (~50 miles)
    const limit = parseInt((req.query['limit'] as string) || '100', 10);

    const osmLocations = await searchCampingNearDFW(radiusKm, limit);
    
    // Convert OSM format to our Location format
    const locations = osmLocations
      .filter((osm) => osm.lat && osm.lon) // Ensure coordinates exist
      .map((osm) => convertOSMToLocation(osm))
      .filter((loc) => loc['latitude'] && loc['longitude']); // Filter out invalid locations

    return res.json({
      success: true,
      data: locations,
      total: locations.length,
      source: 'OpenStreetMap',
    });
  } catch (error) {
    next(error);
    return;
  }
});

//  Sync OSM locations to database (optional - for persistence)
router.post('/osm/sync', authenticate, async (req, res, next) => {
  try {
    const radiusKm = parseInt((req.body['radius'] as string) || '80', 10);
    const limit = parseInt((req.body['limit'] as string) || '100', 10);

    const osmLocations = await searchCampingNearDFW(radiusKm, limit);
    
    const syncedLocations = [];
    
    for (const osm of osmLocations) {
      if (!osm.lat || !osm.lon || !osm.tags?.name) continue;
      
      const locationData = convertOSMToLocation(osm);
      
      // Check if location already exists (by name and coordinates)
      const existing = await prisma.location.findFirst({
        where: {
          name: locationData['name'] as string,
          latitude: { gte: (locationData['latitude'] as number) - 0.001, lte: (locationData['latitude'] as number) + 0.001 },
          longitude: { gte: (locationData['longitude'] as number) - 0.001, lte: (locationData['longitude'] as number) + 0.001 },
        },
      });

      if (!existing) {
        const created = await prisma.location.create({
          data: locationData as any,
        });
        syncedLocations.push(created);
      }
    }

    return res.json({
      success: true,
      message: `Synced ${syncedLocations.length} new locations from OpenStreetMap`,
      data: syncedLocations,
      total: syncedLocations.length,
    });
  } catch (error) {
    next(error);
    return;
  }
});


// Single location by ID
router.get('/id/:id', optionalAuth, async (req, res, next) => {
  try {
    let location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // If websiteUrl is missing, try to fetch from OpenStreetMap (async, don't block response)
    if (!location.websiteUrl && location.latitude && location.longitude) {
      // Don't await - fetch website in background to avoid blocking the response
      searchCampingNearCoordinates(
        location.latitude,
        location.longitude,
        2, // Search within 2km
        5  // Get up to 5 results
      ).then((osmLocations) => {
        // Find the closest matching OSM location with a website
        const closestOSM = osmLocations.find((osm) => {
          if (!osm.tags?.website || !location) return false;
          
          const osmLat = osm.lat || osm.center?.lat || 0;
          const osmLon = osm.lon || osm.center?.lon || 0;
          
          // Check if name matches (similarity check)
          const locationNameLower = location.name.toLowerCase();
          const osmNameLower = (osm.tags.name || '').toLowerCase();
          
          // Match if coordinates are very close (within ~0.005 degrees ≈ 500m) 
          // OR if names are similar
          const distance = Math.sqrt(
            Math.pow(osmLat - location.latitude, 2) + 
            Math.pow(osmLon - location.longitude, 2)
          );
          
          const nameMatch = locationNameLower.includes(osmNameLower) || 
                           osmNameLower.includes(locationNameLower) ||
                           distance < 0.005;
          
          return nameMatch && distance < 0.01; // Within ~1km
        });

        // If we found a close match with a website, update the database
        if (closestOSM && closestOSM.tags?.website) {
          const websiteUrl = closestOSM.tags.website;
          
          // Ensure URL has protocol
          const normalizedUrl = websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://')
            ? websiteUrl
            : `https://${websiteUrl}`;
          
          // Update the location in database with the website URL (don't await)
          prisma.location.update({
            where: { id: location.id },
            data: { websiteUrl: normalizedUrl },
          }).then(() => {
            console.log(`✅ Successfully updated location ${location.id} with website URL: ${normalizedUrl}`);
          }).catch((err) => {
            console.log('❌ Could not update location with website:', err);
          });
        } else {
          console.log(`ℹ️  No matching website found for location ${location.id} (${location.name})`);
        }
      }).catch((osmError) => {
        // Silently fail - just log the error
        console.log('Could not fetch website from OSM:', osmError);
      });
    }

    // If images are missing or empty or are placeholder/local paths, try to fetch from external sources (async, don't block response)
    const currentImages = location.images 
      ? (Array.isArray(location.images) ? location.images : (location.images as any)?.items || [])
      : [];
    const hasImages = currentImages.length > 0 && currentImages.some((img: any) => {
      const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img?.path || '');
      // Check if it's a real external URL (not placeholder or local path)
      return imgUrl && 
             !imgUrl.includes('placeholder') && 
             !imgUrl.startsWith('/images/') && // Don't treat local paths as real images
             (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'));
    });

    if (!hasImages && location.name) {
      // Don't await - fetch images in background to avoid blocking the response
      fetchLocationImages(location.name, location.locationType, 3)
        .then((images) => {
          if (images.length > 0) {
            // Update the location in database with the images (don't await)
            prisma.location.update({
              where: { id: location.id },
              data: { images },
            }).then(() => {
              console.log(`✅ Successfully updated location ${location.id} with ${images.length} images`);
            }).catch((err) => {
              console.log('❌ Could not update location with images:', err);
            });
          } else {
            console.log(`ℹ️  No images found for location ${location.id} (${location.name})`);
          }
        })
        .catch((imgError) => {
          // Silently fail - just log the error
          console.log(`❌ Could not fetch images for location ${location.id}:`, imgError.message || imgError);
        });
    }

    return res.json({ success: true, data: location });
  } catch (error: any) {
    // Handle database connection errors gracefully
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      console.error('Database connection error:', error.message);
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    // For other errors, use the error handler
    next(error);
    return;
  }
});

//  Update a location
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

//  Delete a location
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
