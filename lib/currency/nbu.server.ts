import 'server-only';

type NbuExchangeItem = {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
  special?: 'Y' | 'N';
};

type UsdToUahRateResult = {
  rate: number;
  exchangedate: string; // yyyymmdd format from NBU
};

const NBU_ENDPOINT = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json';
const NBU_ENDPOINT_WITH_DATE =
  'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=';

let cached: (UsdToUahRateResult & { cacheKey: string; fetchedAt: number }) | null = null;
let inflight: Promise<UsdToUahRateResult> | null = null;

function toNbuDateParam(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function fetchUsdToUahRateFromNbu(date?: Date): Promise<UsdToUahRateResult> {
  const url = date
    ? `${NBU_ENDPOINT_WITH_DATE}${toNbuDateParam(date)}&json`
    : NBU_ENDPOINT;

  const res = await fetch(url, {
    // NBU updates daily. Revalidate ~1 day to reduce upstream load.
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`NBU fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as NbuExchangeItem[];
  const item = data?.[0];

  if (!item || typeof item.rate !== 'number' || !item.exchangedate) {
    throw new Error('NBU response has unexpected format');
  }

  return {
    rate: item.rate,
    exchangedate: item.exchangedate,
  };
}

export async function getUsdToUahRate(date?: Date): Promise<UsdToUahRateResult> {
  const cacheKey = date ? `date:${toNbuDateParam(date)}` : 'current';

  // Basic in-memory cache for the lifetime of this server instance.
  if (cached && cached.cacheKey === cacheKey) {
    // Cache for ~1 day to minimize NBU upstream costs.
    const maxAgeMs = 24 * 60 * 60 * 1000 + 5 * 60 * 1000; // +5m buffer
    if (Date.now() - cached.fetchedAt < maxAgeMs) {
      return { rate: cached.rate, exchangedate: cached.exchangedate };
    }
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const result = await fetchUsdToUahRateFromNbu(date);
      cached = { ...result, cacheKey, fetchedAt: Date.now() };
      return result;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

