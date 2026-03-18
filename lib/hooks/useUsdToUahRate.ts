'use client';

import { useEffect, useState } from 'react';

type RateResponse = {
  rate: number;
  exchangedate: string;
};

type UseUsdToUahRateState = {
  rate: number | null;
  exchangedate: string | null;
  loading: boolean;
  error: string | null;
};

const CACHE_KEY = 'usd_to_uah_rate_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

let memoryCache: (RateResponse & { fetchedAt: number }) | null = null;
let inflight: Promise<RateResponse> | null = null;

function getCachedRateFromMemory(): (RateResponse & { fetchedAt: number }) | null {
  if (!memoryCache) return null;
  if (Date.now() - memoryCache.fetchedAt >= MAX_AGE_MS) return null;
  return memoryCache;
}

function getCachedRateFromLocalStorage(): (RateResponse & { fetchedAt: number }) | null {
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (!cachedRaw) return null;

    const parsed = JSON.parse(cachedRaw) as RateResponse & { fetchedAt?: number };
    if (!parsed?.rate || !parsed.exchangedate || !parsed.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt >= MAX_AGE_MS) return null;

    return { rate: parsed.rate, exchangedate: parsed.exchangedate, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

async function fetchRateFromApi(): Promise<RateResponse> {
  const res = await fetch('/api/currency/usd-to-uah');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as RateResponse;
  if (!data?.rate || !data.exchangedate) throw new Error('Bad response from /api/currency/usd-to-uah');
  return data;
}

export function useUsdToUahRate(options?: { initialRate?: number; initialExchangedate?: string }): UseUsdToUahRateState {
  const [state, setState] = useState<UseUsdToUahRateState>(() => {
    if (options?.initialRate != null && Number.isFinite(options.initialRate)) {
      return {
        rate: options.initialRate,
        exchangedate: options.initialExchangedate ?? null,
        loading: false,
        error: null,
      };
    }

    const mem = getCachedRateFromMemory();
    if (mem) {
      return { rate: mem.rate, exchangedate: mem.exchangedate, loading: false, error: null };
    }

    const ls = getCachedRateFromLocalStorage();
    if (ls) {
      memoryCache = { rate: ls.rate, exchangedate: ls.exchangedate, fetchedAt: ls.fetchedAt };
      return { rate: ls.rate, exchangedate: ls.exchangedate, loading: false, error: null };
    }

    return { rate: null, exchangedate: null, loading: true, error: null };
  });

  useEffect(() => {
    let cancelled = false;

    // If we got an explicit initial rate (e.g. from server-render), don't refetch immediately.
    if (options?.initialRate != null && Number.isFinite(options.initialRate)) {
      return;
    }

    // If we already have a fresh cached rate (memory/localStorage), do nothing.
    if (getCachedRateFromMemory() || getCachedRateFromLocalStorage()) {
      return;
    }

    const run = async () => {
      try {
        if (!inflight) {
          inflight = fetchRateFromApi().finally(() => {
            inflight = null;
          });
        }

        const data = await inflight;

        if (cancelled) return;

        memoryCache = { rate: data.rate, exchangedate: data.exchangedate, fetchedAt: Date.now() };
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ...data, fetchedAt: memoryCache.fetchedAt })
        );

        setState({
          rate: data.rate,
          exchangedate: data.exchangedate,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          rate: null,
          exchangedate: null,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load NBU rate',
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

