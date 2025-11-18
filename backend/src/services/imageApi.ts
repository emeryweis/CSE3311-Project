import axios from 'axios';

/**
 * Fetch images for a location using Wikipedia API
 * Wikipedia has many images of parks, campgrounds, and outdoor locations
 */
export async function fetchLocationImagesFromWikipedia(
  locationName: string,
  limit: number = 3
): Promise<string[]> {
  try {
    // Clean location name for Wikipedia search (remove common suffixes)
    const cleanName = locationName
      .replace(/\s+(State Park|National Park|Lake|Campground|Park)$/i, '')
      .trim();

    // Search Wikipedia for the location
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      cleanName
    )}`;

    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
      },
    });

    const images: string[] = [];

    // Get thumbnail image if available
    if (response.data.thumbnail?.source) {
      images.push(response.data.thumbnail.source);
    }

    // Get original image if available (different from thumbnail)
    if (response.data.originalimage?.source && 
        response.data.originalimage.source !== response.data.thumbnail?.source) {
      images.push(response.data.originalimage.source);
    }

    // If we have a Wikipedia page, try to get more images from the page
    if (response.data.content_urls?.desktop?.page) {
      const pageUrl = response.data.content_urls.desktop.page;
      // Extract page title from URL
      const pageTitle = decodeURIComponent(pageUrl.split('/').pop() || '').replace(/_/g, ' ');

      if (pageTitle) {
        try {
          // Get images from the Wikipedia page
          const imagesUrl = `https://en.wikipedia.org/api/rest_v1/page/media/${encodeURIComponent(
            pageTitle
          )}`;

          const imagesResponse = await axios.get(imagesUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
            },
          });

          if (imagesResponse.data?.items) {
            for (const item of imagesResponse.data.items.slice(0, limit - images.length)) {
              if (item.original?.source) {
                images.push(item.original.source);
              } else if (item.thumbnail?.source) {
                images.push(item.thumbnail.source);
              }
            }
          }
        } catch (err) {
          // Silently fail - we already have some images
          console.log('Could not fetch additional images from Wikipedia:', err);
        }
      }
    }

    return images.slice(0, limit);
  } catch (error: any) {
    // If the exact page doesn't exist, try searching
    if (error.response?.status === 404) {
      try {
        // Clean location name for search
        const searchName = locationName
          .replace(/\s+(State Park|National Park|Lake|Campground|Park)$/i, '')
          .trim();
        
        // Try searching Wikipedia for the location
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/search/${encodeURIComponent(
          searchName
        )}?limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
          },
        });

        if (searchResponse.data?.pages && searchResponse.data.pages.length > 0) {
          const firstPage = searchResponse.data.pages[0];
          const resultImages: string[] = [];
          
          if (firstPage.thumbnail?.source) {
            resultImages.push(firstPage.thumbnail.source);
          }
          
          // Try to get the full page summary for more images
          if (firstPage.key) {
            try {
              const pageSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                firstPage.key
              )}`;
              
              const pageSummaryResponse = await axios.get(pageSummaryUrl, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
                },
              });
              
              if (pageSummaryResponse.data.thumbnail?.source) {
                if (!resultImages.includes(pageSummaryResponse.data.thumbnail.source)) {
                  resultImages.push(pageSummaryResponse.data.thumbnail.source);
                }
              }
              
              if (pageSummaryResponse.data.originalimage?.source) {
                if (!resultImages.includes(pageSummaryResponse.data.originalimage.source)) {
                  resultImages.push(pageSummaryResponse.data.originalimage.source);
                }
              }
            } catch (summaryError) {
              // Silently fail - we already have some images
            }
          }
          
          if (resultImages.length > 0) {
            return resultImages.slice(0, limit);
          }
        }
      } catch (searchError) {
        // Silently fail - will try other sources
        console.log('Could not search Wikipedia for images:', searchError);
      }
    }
    console.log('Could not fetch images from Wikipedia:', error.message);
    return [];
  }
}

/**
 * Fetch images for a location using Unsplash API (requires API key)
 * This is a fallback if Wikipedia doesn't have images
 */
export async function fetchLocationImagesFromUnsplash(
  locationName: string,
  limit: number = 3
): Promise<string[]> {
  // Note: Unsplash requires an API key
  // For now, we'll use a placeholder or return empty
  // You can add your Unsplash API key in .env if needed
  const unsplashAccessKey = process.env['UNSPLASH_ACCESS_KEY'];

  if (!unsplashAccessKey) {
    return [];
  }

  try {
    const searchUrl = `https://api.unsplash.com/search/photos`;
    const response = await axios.get(searchUrl, {
      params: {
        query: `${locationName} camping outdoor nature`,
        per_page: limit,
        orientation: 'landscape',
      },
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
      timeout: 10000,
    });

    if (response.data?.results) {
      return response.data.results
        .map((result: any) => result.urls?.regular || result.urls?.small)
        .filter(Boolean)
        .slice(0, limit);
    }

    return [];
  } catch (error: any) {
    console.log('Could not fetch images from Unsplash:', error.message);
    return [];
  }
}

/**
 * Generate placeholder images based on location type
 * This is a fallback if no real images are found
 */
export function generatePlaceholderImage(_locationName: string, _locationType: string): string[] {
  // Use placeholder service that generates images based on keywords
  return [
    `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&h=600&fit=crop&q=80`,
  ];
}

/**
 * Fetch images for a location using multiple sources
 * Tries Wikipedia first, then Unsplash, then placeholder
 */
export async function fetchLocationImages(
  locationName: string,
  locationType?: string,
  limit: number = 3
): Promise<string[]> {
  // Try Wikipedia first (most reliable for named locations)
  let images = await fetchLocationImagesFromWikipedia(locationName, limit);

  // If we have enough images, return them
  if (images.length >= limit) {
    return images.slice(0, limit);
  }

  // Try Unsplash if Wikipedia didn't return enough
  if (images.length < limit) {
    const unsplashImages = await fetchLocationImagesFromUnsplash(
      locationName,
      limit - images.length
    );
    images = [...images, ...unsplashImages];
  }

  // If still no images, use placeholder camping images
  if (images.length === 0) {
    images = generatePlaceholderImage(locationName, locationType || 'campground');
  }

  return images.slice(0, limit);
}

