"use client";

import {
  use,
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Phone,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShopHeader } from '@/components/shop/header';
import { ShopSidebar } from '@/components/shop/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/lib/hooks/useCart';
import { useCategories } from '@/lib/hooks/useCategories';
import { createInquiry } from '@/lib/services/inquiries';
import {
  getProductById,
  incrementProductViews,
} from '@/lib/services/products';
import { sendTelegramInquiry } from '@/lib/services/telegram';
import {
  Product,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
} from '@/lib/types';

const statusColors: Record<string, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  out_of_stock: 'bg-red-500/10 text-red-400 border-red-500/20',
  discontinued: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories } = useCategories();
  const { addItem } = useCart();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        if (data) {
          // Increment views
          await incrementProductViews(id);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const getConditionLabel = (condition: string) => {
    return PRODUCT_CONDITIONS.find((c) => c.value === condition)?.label || condition;
  };

  const handleNextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!product) {
        toast.error('Помилка: товар не знайдено');
        return;
      }

      // Create inquiry in database
      const inquiryData = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productPartNumber: product.partNumber,
        productStatus: product.status,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        message: message,
      };

      await createInquiry(inquiryData);

      // Send to Telegram
      await sendTelegramInquiry(inquiryData);

      toast.success('Запит надіслано!', {
        description: 'Ми зв\'яжемося з вами найближчим часом.',
      });
      setShowInquiryForm(false);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (error) {
      console.error('Inquiry submit error:', error);
      toast.error('Помилка відправки запиту. Спробуйте пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Could navigate to home with category selected
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Prevent adding products with discontinued or on_order status
    if (product.status === 'discontinued' || product.status === 'on_order') {
      toast.error('Цей товар недоступний для додавання до кошика. Будь ласка, зв\'яжіться з нами.');
      setShowInquiryForm(true);
      return;
    }

    addItem(product);
    toast.success('Товар додано до корзини!', {
      description: product.name,
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-zinc-950">
        <ShopHeader
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <ShopSidebar
            categories={categories}
            loading={true}
            selectedCategoryId={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 space-y-6">
              <Skeleton className="h-12 w-64 bg-zinc-900/60" />
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-96 bg-zinc-900/60" />
                <Skeleton className="h-96 bg-zinc-900/60" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen flex-col bg-zinc-950">
        <ShopHeader
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <ShopSidebar
            categories={categories}
            loading={false}
            selectedCategoryId={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-8 text-center space-y-4">
                  <p className="text-white font-medium">Товар не знайдено</p>
                  <p className="text-zinc-500 text-sm">
                    Можливо, товар був видалений або посилання неправильне.
                  </p>
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="border-zinc-800 text-zinc-200 hover:border-amber-500 hover:text-white"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Повернутися на головну
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusClass = statusColors[product.status] || statusColors.discontinued;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <ShopHeader
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />


      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <ShopSidebar
          categories={categories}
          loading={false}
          selectedCategoryId={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Link href="/" className="hover:text-amber-400 transition">
                Головна
              </Link>
              <span>/</span>
              <span className="text-white">{product.name}</span>
            </div>

            {/* Main content */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Images */}
              <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-zinc-950">
                    {product.images.length > 0 ? (
                      <>
                        <Image
                          src={product.images[currentImageIndex].url}
                          alt={product.images[currentImageIndex].alt}
                          fill
                          className="object-cover"
                        />
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleNextImage}
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                              {product.images.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`w-2 h-2 rounded-full transition ${index === currentImageIndex
                                      ? 'bg-amber-400'
                                      : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        Немає фото
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {product.images.length > 1 && (
                    <div className="p-4 grid grid-cols-4 gap-2">
                      {product.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${index === currentImageIndex
                              ? 'border-amber-500'
                              : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product info */}
              <div className="space-y-6">
                {/* Main info card */}
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <CardTitle className="text-2xl text-white">{product.name}</CardTitle>
                        <CardDescription className="text-zinc-400">
                          Артикул: {product.partNumber || product.sku}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={statusClass}>
                        {getStatusLabel(product.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-amber-400">
                        {product.price.toLocaleString()} ₴
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-zinc-500 line-through">
                          {product.originalPrice.toLocaleString()} ₴
                        </span>
                      )}
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Бренд</span>
                        <span className="text-white font-medium">{product.brand || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Стан</span>
                        <span className="text-white font-medium">{getConditionLabel(product.condition)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Категорія</span>
                        <span className="text-white font-medium">{getCategoryName(product.categoryId)}</span>
                      </div>
                      {product.carBrand && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Марка авто</span>
                          <span className="text-white font-medium">{product.carBrand}</span>
                        </div>
                      )}
                      {product.carModel && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Модель авто</span>
                          <span className="text-white font-medium">{product.carModel}</span>
                        </div>
                      )}
                      {product.year && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Рік</span>
                          <span className="text-white font-medium">{product.year}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="space-y-2">
                      {product.status === 'in_stock' && (
                        <Button
                          onClick={handleAddToCart}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Додати в корзину
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowInquiryForm(!showInquiryForm)}
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {showInquiryForm ? 'Сховати форму' : 'Зробити запит'}
                      </Button>
                    </div>

                    <div className="flex gap-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{product.views || 0} переглядів</span>
                      </div>
                      <span>•</span>
                      <span>
                        Додано {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Inquiry form */}
                {showInquiryForm && (
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-amber-400" />
                        Форма запиту
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Заповніть форму і ми зв&apos;яжемося з вами найближчим часом
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleInquirySubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-zinc-300">
                            Ім&apos;я
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-zinc-950 border-zinc-800 text-white"
                            placeholder="Ваше ім'я"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-zinc-300">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-zinc-950 border-zinc-800 text-white"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-zinc-300">
                            Телефон
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="bg-zinc-950 border-zinc-800 text-white"
                            placeholder="+380..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-zinc-300">
                            Повідомлення
                          </Label>
                          <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-white min-h-[100px]"
                            placeholder="Опишіть ваш запит..."
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Відправка...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Відправити запит
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-400" />
                    Опис
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional info */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* OEM numbers */}
              {product.oem.length > 0 && (
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base">OEM номери</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {product.oem.map((oem) => (
                        <Badge key={oem} variant="outline" className="border-zinc-700 text-zinc-300">
                          {oem}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Compatibility */}
              {product.compatibility.length > 0 && (
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Сумісність</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {product.compatibility.map((item) => (
                        <Badge key={item} variant="outline" className="border-zinc-700 text-zinc-300">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact info */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Маєте питання щодо цього товару?
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Зв&apos;яжіться з нами і ми з радістю допоможемо
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Подзвонити
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Sidebar - Mobile */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-zinc-800">
            <ShopSidebar
              categories={categories}
              loading={false}
              selectedCategoryId={selectedCategory}
              onCategorySelect={handleCategorySelect}
              isMobile={true}
              onClose={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

