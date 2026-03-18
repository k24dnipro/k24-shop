import { NextRequest, NextResponse } from 'next/server';
import { getUsdToUahRate } from '@/lib/currency/nbu.server';

/**
 * GET /api/currency/usd-to-uah
 * Возвращает официальный курс НБУ для USD->UAH.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');

  // Поддерживаем формат YYYY-MM-DD.
  let date: Date | undefined;
  if (dateParam) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (m) {
      const [, yyyy, mm, dd] = m;
      date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
  }

  const { rate, exchangedate } = await getUsdToUahRate(date);
  return NextResponse.json({ rate, exchangedate });
}

