import { Product } from '@/modules/products/types';

export function generateProductStructuredData(
  product: Product,
  siteUrl: string,
  priceUah: number,
  priceValidUntil?: string
) {
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
          streetAddress?: string;
          addressLocality: string;
          addressRegion?: string;
          postalCode?: string;
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
  } = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.images?.map(img => img.url) || [imageUrl],
    sku: product.sku || product.partNumber || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Unknown',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: 'UAH',
      price: Math.ceil(priceUah).toString(),
      priceValidUntil:
        priceValidUntil ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: availability,
      itemCondition: itemCondition,
      seller: {
        '@type': 'Organization',
        name: 'K24 Parts',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Підгороднє',
          addressRegion: 'Дніпропетровська область',
          postalCode: '52001',
          addressCountry: 'UA',
        },
      },
    },
  };

  // Add MPN if available
  if (product.partNumber) {
    structuredData.mpn = product.partNumber;
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
  if (product.oem) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Оригінальний номер (OEM)',
      value: product.oem,
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
    name: 'K24 Parts',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+380939590505',
      contactType: 'customer service',
      areaServed: 'UA',
      availableLanguage: 'Ukrainian',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Підгороднє',
      addressRegion: 'Дніпропетровська область',
      postalCode: '52001',
      addressCountry: 'UA',
    },
    sameAs: [
      // Add your social media links here when available
      // 'https://www.facebook.com/k24shop',
      // 'https://www.instagram.com/k24shop',
    ],
  };
}

export function generateLocalBusinessStructuredData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    name: 'K24 Parts',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/logo.png`,
    telephone: '+380939590505',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Підгороднє',
      addressRegion: 'Дніпропетровська область',
      postalCode: '52001',
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 48.530915,
      longitude: 35.03727,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    priceRange: '$$',
    servesCuisine: undefined,
    currenciesAccepted: 'UAH',
    paymentAccepted: 'готівка, банківський переказ',
    areaServed: {
      '@type': 'Country',
      name: 'Ukraine',
    },
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
