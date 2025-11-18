import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a dummy user for seeding reviews (to handle ratings)
  const dummyUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'seeduser',
      passwordHash: 'dummyhash', // Note: In production, use a proper hash
      firstName: 'Seed',
      lastName: 'User',
    },
  });

  // Hardcoded mock locations data 
  const mockLocations = [
    {
      name: 'Yosemite National Park',
      description: 'Iconic granite cliffs, waterfalls, and ancient sequoias await you in this world-renowned park.',
      location: 'California',
      coordinates: { lat: 37.8651, lng: -119.5383 },
      activities: ['Camping', 'Hiking', 'Photography', 'Rock Climbing'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.9,
      price: 35,
      images: [
        '/images/samplephoto4.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
    {
      name: 'Glacier National Park',
      description: 'Pristine wilderness with over 700 miles of trails and stunning alpine scenery.',
      location: 'Montana',
      coordinates: { lat: 48.7596, lng: -113.7870 },
      activities: ['Camping', 'Hiking', 'Wildlife Viewing', 'Photography'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Lodge'],
      isActive: true,
      verified: true,
      rating: 4.8,
      price: 30,
      images: [
        '/images/samplephoto4.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto2.jpg'
      ],
      availability: true
    },
    {
      name: 'Grand Canyon National Park',
      description: 'One of the world\'s most spectacular natural wonders with incredible hiking opportunities.',
      location: 'Arizona',
      coordinates: { lat: 36.1069, lng: -112.1129 },
      activities: ['Camping', 'Hiking', 'Photography', 'River Rafting'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.9,
      price: 25,
      images: [
        '/images/samplephoto1.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Rocky Mountain National Park',
      description: 'High-altitude adventures with stunning mountain views and diverse wildlife.',
      location: 'Colorado',
      coordinates: { lat: 40.3428, lng: -105.6836 },
      activities: ['Camping', 'Hiking', 'Mountain Biking', 'Climbing'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.7,
      price: 28,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Lake Tahoe',
      description: 'The largest alpine lake in North America, known for its clarity and surrounding mountains.',
      location: 'California',
      coordinates: { lat: 39.0968, lng: -120.0323 },
      activities: ['Camping', 'Hiking', 'Boating', 'Skiing', 'Water Sports'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Lodge', 'Equipment Rentals'],
      isActive: true,
      verified: true,
      rating: 4.8,
      price: 0,
      images: [
        '/images/samplephoto4.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
    {
      name: 'Zion National Park',
      description: 'Massive sandstone cliffs of cream, pink, and red that soar into a brilliant blue sky.',
      location: 'Utah',
      coordinates: { lat: 37.2978, lng: -113.0288 },
      activities: ['Camping', 'Hiking', 'Canyoneering', 'Photography'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.7,
      price: 35,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Yellowstone National Park',
      description: 'America\'s first national park featuring geysers, hot springs, and abundant wildlife.',
      location: 'Wyoming',
      coordinates: { lat: 44.4280, lng: -110.5885 },
      activities: ['Camping', 'Hiking', 'Wildlife Viewing'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.9,
      price: 30,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Acadia National Park',
      description: 'Protects the natural beauty of the highest rocky headlands along the Atlantic coastline of the United States, an abundance of habitats, and a rich cultural heritage.',
      location: 'Maine',
      coordinates: { lat: 44.338974, lng: -68.27343 },
      activities: ['Hiking', 'Driving', 'Biking'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Visitor Center'],
      isActive: true,
      verified: true,
      rating: 4.8,
      price: 35,
      images: [
        '/images/samplephoto1.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Dinosaur Valley State Park',
      description: 'Allows visitors to walk in dinosaur footprints in the bed of the Paluxy River, a site where dinosaurs once roamed, located a short drive from Fort Worth.',
      location: 'Texas',
      coordinates: { lat: 32.246194, lng: -97.813375 },
      activities: ['Hiking', 'Swimming', 'Fishing', 'Camping', 'Mountain biking'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Park store'],
      isActive: true,
      verified: true,
      rating: 4.3,
      price: 8,
      images: [
        '/images/samplephoto4.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
    {
      name: 'Cedar Hill State Park',
      description: 'Offers a relaxing escape with activities like lake visits, exploring old Texas farms, and hiking through rugged limestone hills and rare prairie pockets, located just a short drive from the DFW Metroplex.',
      location: 'Texas',
      coordinates: { lat: 32.621721, lng: -96.979087 },
      activities: ['Hiking', 'Biking', 'Fishing', 'Camping', 'Swimming'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Boat Ramp', 'Playground'],
      isActive: true,
      verified: true,
      rating: 4.0,
      price: 7,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto4.jpg'
      ],
      availability: true
    },
    {
      name: 'Lake Mineral Wells State Park',
      description: 'Sits in the heart of cattle country, near what was once a popular health resort, offering a lake, a rock climbing area, and miles of trails, located just 45 minutes west of Fort Worth.',
      location: 'Texas',
      coordinates: { lat: 32.812655, lng: -98.043368 },
      activities: ['Hiking', 'Rock Climbing', 'Boating', 'Camping', 'Fishing'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Boat Ramp', 'Park Store'],
      isActive: true,
      verified: true,
      rating: 4.0,
      price: 7,
      images: [
        '/images/samplephoto1.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
    {
      name: 'Cleburne State Park',
      description: 'Offers a peaceful getaway with a spring-fed lake, trails through the forest, and quiet campsites, located 30 minutes southwest of Fort Worth on the northern edge of the Hill Country.',
      location: 'Texas',
      coordinates: { lat: 32.252365, lng: -97.549617 },
      activities: ['Hiking', 'Fishing', 'Boating', 'Camping', 'Swimming'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Boat Ramp', 'Park Store'],
      isActive: true,
      verified: true,
      rating: 4.2,
      price: 6,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto2.jpg'
      ],
      availability: true
    },
    {
      name: 'Fort Worth Nature Center',
      description: 'Enhances the quality of life by enrolling and educating the community in the preservation and protection of natural areas.',
      location: 'Texas',
      coordinates: { lat: 32.8442, lng: -97.4757 },
      activities: ['Hiking', 'Wildlife Viewing', 'Photography'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Interpretive Center'],
      isActive: true,
      verified: true,
      rating: 4.5,
      price: 6,
      images: [
        '/images/samplephoto4.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
    {
      name: 'Eagle Mountain Lake',
      description: 'Fort Worth’s premiere daycation spot, ideal for relaxing, swimming, and creating summer memories, with a beautiful beach at its southern point.',
      location: 'Texas',
      coordinates: { lat: 32.8926, lng: -97.4931 },
      activities: ['Swimming', 'Fishing', 'Boating'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Picnic Pavilions'],
      isActive: true,
      verified: true,
      rating: 4.5,
      price: 0,
      images: [
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg',
        '/images/samplephoto2.jpg'
      ],
      availability: true
    },
    {
      name: 'Possum Kingdom State Park',
      description: 'Located in the rugged canyon country of the Brazos River Valley, features clear, blue water and striking scenery at Lake Possum Kingdom, ideal for family outings and outdoor activities.',
      location: 'Texas',
      coordinates: { lat: 32.8736, lng: -98.5593 },
      activities: ['Swimming', 'Boating', 'Fishing', 'Hiking', 'Camping'],
      amenities: ['Restrooms', 'Water', 'Parking', 'Boat Launch', 'Park Store'],
      isActive: true,
      verified: true,
      rating: 4.5,
      price: 4,
      images: [
        '/images/samplephoto1.jpg',
        '/images/samplephoto2.jpg',
        '/images/samplephoto3.jpg'
      ],
      availability: true
    },
  ];

  for (const loc of mockLocations) {
    // Determine locationType based on name
    let locationType = 'park';
    if (loc.name.toLowerCase().includes('national park')) {
      locationType = 'national_park';
    } else if (loc.name.toLowerCase().includes('lake')) {
      locationType = 'lake';
    }

    // Create or skip location
    let location = await prisma.location.findFirst({ where: { name: loc.name } });
    if (!location) {
      location = await prisma.location.create({
        data: {
          name: loc.name,
          description: loc.description,
          locationType,
          latitude: loc.coordinates.lat,
          longitude: loc.coordinates.lng,
          state: loc.location,
          country: 'US',
          amenities: loc.amenities,
          costPerNight: loc.price,           // Prisma Decimal is fine with a number here
          images: loc.images,
          verified: true,
          isActive: loc.availability,
          rating: loc.rating ?? null,        // <-- set it!
        },
      });
    } else if (location.rating == null && loc.rating != null) {
      // keep seed idempotent but fill in missing rating
      await prisma.location.update({
        where: { id: location.id },
        data: { rating: loc.rating },
      });
    }

    

    // Seed a review to capture the rating (since rating isn't directly on Location)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: dummyUser.id,
        locationId: location.id,
      },
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          userId: dummyUser.id,
          locationId: location.id,
          rating: Math.round(loc.rating), // Round to nearest int (1-5)
          content: 'Seeded review to match mock rating',
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });