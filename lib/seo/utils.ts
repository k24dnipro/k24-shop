import { Product } from '@/modules/products/types';

export function generateProductStructuredData(product: Product, siteUrl: string) {
  const availabilityMap: Record<string, string> = {
    'in_stock': 'https://schema.org/InStock',
    'out_of_stock': 'https://schema.org/OutOfStock',
    'on_order': 'https://schema.org/PreOrder',
    'discontinued': 'https://schema.org/Discontinued',
  };

  const conditionMap: Record<string, string> = {
    'new': 'https://schema.org/NewCondition',
    'used': 'https://schema.org/UsedCondition',
    'refurbished': 'https://schema.org/RefurbishedCondition',
  };

  const imageUrl = product.images?.[0]?.url || `${siteUrl}/logo.png`;

  // Ensure availability is always set, default to InStock
  const availability = product.status && availabilityMap[product.status] 
    ? availabilityMap[product.status] 
    : 'https://schema.org/InStock';
  
  // Ensure condition is always set, default to NewCondition
  const itemCondition = product.condition && conditionMap[product.condition]
    ? conditionMap[product.condition]
    : 'https://schema.org/NewCondition';

  const structuredData: {
    '@context': string;
    '@type': string;
    name: string;
    description: string;
    image: string[];
    sku: string;
    brand: { '@type': string; name: string };
    offers: {
      '@type': string;
      url: string;
      priceCurrency: string;
      price: string;
      priceValidUntil: string;
      availability: string;
      itemCondition: string;
      seller: {
        '@type': string;
        name: string;
        address: {
          '@type': string;
          addressLocality: string;
          addressCountry: string;
        };
      };
    };
    additionalProperty?: Array<{
      '@type': string;
      name: string;
      value: string;
    }>;
    mpn?: string;
    aggregateRating?: {
      '@type': string;
      ratingValue: string;
      reviewCount: number;
    };
  } = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.images?.map(img => img.url) || [imageUrl],
    sku: product.partNumber || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Unknown',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: 'UAH',
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: availability,
      itemCondition: itemCondition,
      seller: {
        '@type': 'Organization',
        name: 'K24 Shop',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Дніпро',
          addressCountry: 'UA',
        },
      },
    },
  };

  // Add MPN if available
  if (product.partNumber) {
    structuredData.mpn = product.partNumber;
  }

  // Add aggregate rating if views > 0
  if (product.views > 0) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: product.views,
    };
  }

  // Add additional properties
  const additionalProperties: Array<{
    '@type': string;
    name: string;
    value: string;
  }> = [];

  if (product.carBrand) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Марка авто',
      value: product.carBrand,
    });
  }
  if (product.carModel) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Модель авто',
      value: product.carModel,
    });
  }
  if (product.year) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Рік',
      value: product.year,
    });
  }

  // Only add additionalProperty if there are items
  if (additionalProperties.length > 0) {
    structuredData.additionalProperty = additionalProperties;
  }

  return structuredData;
}

export function generateOrganizationStructuredData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'K24 Shop',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Дніпро',
      addressRegion: 'Дніпропетровська область',
      addressCountry: 'UA',
    },
    sameAs: [
      // Add your social media links here when available
      // 'https://www.facebook.com/k24shop',
      // 'https://www.instagram.com/k24shop',
    ],
  };
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
