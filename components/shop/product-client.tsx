"use client";

import {
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MessageSquare,
  Package,
  Phone,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductImage } from '@/components/ui/product-image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/lib/hooks/useCart';
import { sendTelegramInquiry } from '@/lib/services/telegram';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import { createInquiry } from '@/modules/inquiries/services/inquiries.service';
import {
  incrementProductViews,
} from '@/modules/products/services/products.service';
import {
  Product,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
} from '@/modules/products/types';

const statusColors: Record<string, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  out_of_stock: 'bg-red-500/10 text-red-400 border-red-500/20',
  discontinued: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

interface ProductClientProps {
  product: Product;
  categoryName: string;
}

export function ProductClient({ product, categoryName }: ProductClientProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showPriceProposalDialog, setShowPriceProposalDialog] = useState(false);
  const { categories } = useCategories();
  const { addItem } = useCart();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Increment views on mount
  useEffect(() => {
    incrementProductViews(product.id).catch(console.error);
  }, [product.id]);

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
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
      // Create inquiry in database
      const inquiryData = {
        productId: product.id,
        productName: product.name,
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

  const handlePriceProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = proposedPrice.trim() ? parseInt(proposedPrice.replace(/\s/g, ''), 10) : NaN;
    if (!priceNum || priceNum <= 0 || !Number.isFinite(priceNum)) {
      toast.error('Вкажіть коректну запропоновану ціну');
      return;
    }
    setSubmitting(true);
    try {
      const inquiryData = {
        productId: product.id,
        productName: product.name,
        productPartNumber: product.partNumber,
        productStatus: product.status,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        message: message.trim() || 'Запропонована ціна',
        proposedPrice: priceNum,
      };
      await createInquiry(inquiryData);
      await sendTelegramInquiry(inquiryData);
      toast.success('Пропозицію надіслано!', {
        description: 'Ми зв\'яжемося з вами щодо ціни.',
      });
      setShowPriceProposalDialog(false);
      setProposedPrice('');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (error) {
      console.error('Price proposal submit error:', error);
      toast.error('Помилка відправки. Спробуйте пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/catalog?category=${categoryId}`);
  };

  const handleAddToCart = () => {
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

  const statusClass = statusColors[product.status] || statusColors.discontinued;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/catalog" className="hover:text-k24-yellow transition">
          Каталог
        </Link>
        <span>/</span>
        <span className="text-white">{product.name}</span>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Images */}
        <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-4/3 bg-zinc-950">
              {product.images.length > 0 ? (
                <>
                  <ProductImage
                    src={product.images[currentImageIndex].url}
                    alt={product.images[currentImageIndex].alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                    priority
                    className="object-cover cursor-zoom-in"
                    onClick={() => {
                      setLightboxIndex(currentImageIndex);
                      setLightboxOpen(true);
                    }}
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
                                ? 'bg-k24-yellow'
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
                        ? 'border-k24-yellow'
                        : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    <ProductImage
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="25vw"
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
                    Артикул: {product.partNumber || '—'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={statusClass}>
                  {getStatusLabel(product.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-k24-yellow">
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
                  <span className="text-white font-medium">{categoryName}</span>
                </div>
                {product.oem && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Оригінальний номер (OEM)</span>
                    <span className="text-white font-medium">{product.oem}</span>
                  </div>
                )}
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
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-2">
                {product.status === 'in_stock' && (
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Додати в корзину
                  </Button>
                )}
                {product.status !== 'in_stock' && (
                  <Button
                    onClick={() => setShowInquiryForm(!showInquiryForm)}
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {showInquiryForm ? 'Сховати форму' : 'Зробити запит'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPriceProposalDialog(true)}
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Запропонувати ціну
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
                  <MessageSquare className="h-5 w-5 text-k24-yellow" />
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
                    className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
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

      {/* Price proposal dialog */}
      <Dialog open={showPriceProposalDialog} onOpenChange={setShowPriceProposalDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-white flex items-center gap-2">
              <Banknote className="h-5 w-5 text-k24-yellow" />
              Запропонувати ціну
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Вкажіть вашу ціну та контакти — ми зв&apos;яжемося з вами
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePriceProposalSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="pp-price" className="text-zinc-300">
                Ваша ціна (грн) *
              </Label>
              <Input
                id="pp-price"
                name="proposedPrice"
                type="number"
                min={1}
                step={1}
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Наприклад 1500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-name" className="text-zinc-300">
                Ім&apos;я *
              </Label>
              <Input
                id="pp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Ваше ім'я"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-phone" className="text-zinc-300">
                Телефон *
              </Label>
              <Input
                id="pp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="+380..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-email" className="text-zinc-300">
                Email *
              </Label>
              <Input
                id="pp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-message" className="text-zinc-300">
                Коментар
              </Label>
              <Textarea
                id="pp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[80px]"
                placeholder="Додаткова інформація (не обов'язково)"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Відправка...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Надіслати пропозицію
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fullscreen image lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="bg-black/90 border-zinc-800 w-full max-w-3xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl p-2 sm:p-4"
          showCloseButton
        >
          {product.images.length > 0 && (
            <div className="relative w-full aspect-4/3 sm:aspect-video">
              <ProductImage
                src={product.images[lightboxIndex].url}
                alt={product.images[lightboxIndex].alt}
                fill
                sizes="100vw"
                quality={90}
                priority
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description */}
      {product.description && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-k24-yellow" />
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
      <Card className="bg-linear-to-br from-k24-yellow/10 to-k24-yellow/5 border-k24-yellow/20">
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
                className="border-k24-yellow/30 bg-k24-yellow/10 text-k24-yellow hover:bg-k24-yellow/20 hover:border-k24-yellow/50"
              >
                <Phone className="mr-2 h-4 w-4" />
                Подзвонити
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
