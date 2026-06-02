import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Eye, ArrowLeft } from 'lucide-react';
import { ShopHeader } from '@/components/shop/header';
import { ShopFooter } from '@/components/shop/footer';
import { getBlogPostBySlug } from '@/modules/blog/services/blog.service';
import { BlogViewsTracker } from './blog-views-tracker';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== 'published') {
    return {
      title: 'Статтю не знайдено',
      description: 'Запитувану статтю не знайдено на сайті K24 Parts',
    };
  }

  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.coverImage || `${siteUrl}/logo.png`;

  return {
    title: {
      absolute: post.metaTitle || `${post.title} | K24 Parts`,
    },
    description: post.metaDescription || post.summary,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      siteName: 'K24 Parts',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      images: [imageUrl],
    },
  };
}

export const revalidate = 300; // 5 mins cache

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <article className="max-w-3xl mx-auto space-y-8">
          {/* Back Button */}
          <div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-k24-yellow transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад до блогу
            </Link>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-6 text-xs sm:text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {post.createdAt.toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {post.views || 0} переглядів
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          )}

          {/* Article Summary */}
          <p className="text-lg text-zinc-300 leading-relaxed font-medium border-l-4 border-k24-yellow pl-4">
            {post.summary}
          </p>

          {/* Article Content (HTML) */}
          <div
            className="blog-content-wrapper text-zinc-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>

      <ShopFooter />

      {/* Background/Client-side views tracker */}
      <BlogViewsTracker postId={post.id} />
    </div>
  );
}
