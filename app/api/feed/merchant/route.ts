import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getUsdToUahRate } from '@/lib/currency/nbu.server';
import { toIntegerUAH } from '@/lib/currency/format';
import { Product } from '@/modules/products/types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache the feed for 1 hour

// Helper to escape XML special characters
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const db = getAdminDb();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';
    const { rate } = await getUsdToUahRate();

    const snapshot = await db.collection('products').get();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>K24 Parts - Автозапчастини</title>
    <link>${siteUrl}</link>
    <description>Магазин автозапчастин K24 Parts в Дніпрі</description>
`;

    snapshot.forEach((doc) => {
      const data = doc.data() as Partial<Product>;
      const sku = typeof data.sku === 'string' ? data.sku.trim() : '';
      
      const status = data.status;
      let availability = 'out_of_stock';
      if (status === 'in_stock') availability = 'in_stock';
      if (status === 'on_order') availability = 'backorder';
      
      const priceUah = toIntegerUAH((data.price || 0) * rate);
      const originalPriceUah = data.originalPrice ? toIntegerUAH(data.originalPrice * rate) : null;
      
      const priceString = `${originalPriceUah && originalPriceUah > priceUah ? originalPriceUah : priceUah} UAH`;
      const salePriceString = originalPriceUah && originalPriceUah > priceUah ? `${priceUah} UAH` : '';

      const images = data.images || [];
      const imageLink = images.length > 0 ? images[0].url : '';
      
      const hasIdentifier = Boolean(data.partNumber || data.oem);

      xml += `    <item>
      <g:id>${escapeXml(sku || doc.id)}</g:id>
      <g:title>${escapeXml(data.name?.substring(0, 150))}</g:title>
      <g:description>${escapeXml(data.description?.substring(0, 5000) || data.name)}</g:description>
      <g:link>${siteUrl}/products/${doc.id}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>${escapeXml(data.condition || 'new')}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceString}</g:price>
`;

      if (salePriceString) {
        xml += `      <g:sale_price>${salePriceString}</g:sale_price>\n`;
      }

      images.slice(1).forEach((img, index) => {
        if (index < 10) { // Google allows up to 10 additional images
          xml += `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>\n`;
        }
      });

      xml += `      <g:brand>${escapeXml(data.brand || 'K24 Parts')}</g:brand>
      <g:mpn>${escapeXml(data.partNumber || doc.id)}</g:mpn>
      <g:identifier_exists>${hasIdentifier ? 'yes' : 'no'}</g:identifier_exists>
    </item>\n`;
    });

    xml += `  </channel>\n</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating Merchant Center XML feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
