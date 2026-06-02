import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Eye, FileText } from 'lucide-react';
import { ShopHeader } from '@/components/shop/header';
import { ShopFooter } from '@/components/shop/footer';
import { getBlogPosts } from '@/modules/blog/services/blog.service';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Блог та корисні статті | K24 Parts',
  },
  description: 'Корисні статті та гайди про підбір автозапчастин, обслуговування автомобілів та новини нашої компанії. Читайте блог K24 Parts Дніпро.',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/blog`,
    title: 'Блог та корисні статті | K24 Parts',
    description: 'Корисні статті та гайди про підбір автозапчастин, обслуговування автомобілів та новини нашої компанії.',
    siteName: 'K24 Parts',
  },
};

export const revalidate = 300; // 5 mins cache

export default async function BlogListPage() {
  const posts = await getBlogPosts({ status: 'published' });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Блог K24 Parts
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Цікаві статті, корисні поради щодо вибору автозапчастин та обслуговування автомобілів.
            </p>
          </div>

          {/* Posts Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-k24-yellow/40 transition-colors"
                >
                  {/* Image wrapper */}
                  <div className="relative aspect-video bg-zinc-950 shrink-0">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-700 bg-zinc-900/40">
                        <FileText className="h-10 w-10 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Text contents */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Meta data row */}
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {post.createdAt.toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views || 0}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white group-hover:text-k24-yellow transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="text-sm font-semibold text-k24-yellow group-hover:underline pt-2">
                      Читати далі →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <FileText className="h-16 w-16 text-zinc-700" />
              <h2 className="text-xl font-semibold text-zinc-400">Публікацій поки немає</h2>
              <p className="text-zinc-600 max-w-sm">Ми вже готуємо корисні матеріали для вас. Завітайте згодом!</p>
            </div>
          )}
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
