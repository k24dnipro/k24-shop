"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Компонент для додавання noindex для сторінок з фільтрами
 * Використовується в Client Components, де не можна використати generateMetadata
 */
export function NoIndexFilter() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Перевіряємо чи є фільтри (окрім category та q)
    const hasFilters = Array.from(searchParams.keys()).some(
      key => key !== 'category' && key !== 'q' && searchParams.get(key)
    );

    let metaRobots = document.querySelector('meta[name="robots"]');

    // Якщо є фільтри - додаємо noindex
    if (hasFilters) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      
      metaRobots.setAttribute('content', 'noindex, follow');
    } else {
      // Якщо фільтрів немає, дозволяємо індексувати сторінку
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    }
  }, [searchParams]);

  return null;
}
