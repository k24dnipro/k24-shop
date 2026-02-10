'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Product image with preloader and fallback when Next.js image optimizer fails (e.g. 500).
 * - Shows skeleton while loading.
 * - On optimizer error, retries with unoptimized (direct URL) so Firebase URLs still display.
 * - On final error, shows placeholder icon instead of broken image.
 */
export function ProductImage({
  src,
  alt,
  className,
  ...props
}: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [useUnoptimized, setUseUnoptimized] = useState(false);

  const handleLoad = () => setStatus('loaded');
  const handleError = () => {
    if (
      !useUnoptimized &&
      typeof src === 'string' &&
      src.includes('firebasestorage.googleapis.com')
    ) {
      setUseUnoptimized(true);
      setStatus('loading');
    } else {
      setStatus('error');
    }
  };

  const isError = status === 'error';

  return (
    <div className={cn('relative size-full', props.fill && 'min-h-0')}>
      {status === 'loading' && (
        <Skeleton className="absolute inset-0 rounded-none z-10" />
      )}
      {isError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500 z-1"
          aria-hidden
        >
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      {!isError && (
        <Image
          key={useUnoptimized ? 'unoptimized' : 'optimized'}
          src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={useUnoptimized}
          {...props}
        />
      )}
    </div>
  );
}
