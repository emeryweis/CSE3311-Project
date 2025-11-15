import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Clearing placeholder images from database...');
  
  // Find all locations with placeholder/local images
  const locations = await prisma.location.findMany({
    where: {
      images: {
        not: Prisma.JsonNull,
      },
    },
  });

  let cleared = 0;
  
  for (const location of locations) {
    const images = location.images as any;
    const imageArray = Array.isArray(images) ? images : (images?.items || []);
    
    // Check if images are placeholder/local paths
    const hasPlaceholderImages = imageArray.some((img: any) => {
      const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img?.path || '');
      return imgUrl && (imgUrl.includes('placeholder') || imgUrl.startsWith('/images/'));
    });
    
    if (hasPlaceholderImages) {
      await prisma.location.update({
        where: { id: location.id },
        data: { images: Prisma.JsonNull },
      });
      cleared++;
      console.log(`✅ Cleared placeholder images for: ${location.name}`);
    }
  }
  
  console.log(`\n✅ Cleared placeholder images from ${cleared} locations`);
  console.log('📍 Now when you view location details, the External API will fetch real images!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

