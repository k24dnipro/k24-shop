'use client';

import { useState } from 'react';
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auth } from '@/firebase';
import { useCart } from '@/lib/hooks/useCart';
import { sendTelegramOrder } from '@/lib/services/telegram';
import { createOrderFromCart } from '@/modules/orders/services/orders.service';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Cart({ open, onOpenChange }: CartProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Будь ласка, заповніть обов\'язкові поля');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        customerInfo,
        items: items.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            partNumber: item.product.partNumber,
            price: item.product.price,
            originalPrice: item.product.originalPrice,
            brand: item.product.brand,
          },
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
        totalItems: getTotalItems(),
      };

      // Якщо користувач залогінений через Firebase (опціональна реєстрація) — прив'язуємо замовлення до нього
      const currentUser = auth.currentUser;

      await createOrderFromCart({
        customerInfo,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          partNumber: item.product.partNumber,
          brand: item.product.brand,
          price: item.product.price,
          quantity: item.quantity,
        })),
        totalPrice: orderData.totalPrice,
        totalItems: orderData.totalItems,
        customerId: currentUser?.uid,
        customerEmail: currentUser?.email ?? (customerInfo.email || undefined),
      });

      // Send to Telegram (як і раніше)
      const success = await sendTelegramOrder(orderData);

      if (success) {
        toast.success('Дякуємо за замовлення! Ми зв\'яжемося з вами найближчим часом.');
        clearCart();
        setCustomerInfo({ name: '', phone: '', email: '', comment: '' });
        onOpenChange(false);
      } else {
        toast.error('Помилка при відправці замовлення. Спробуйте ще раз або зв\'яжіться з нами безпосередньо.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Помилка при оформленні замовлення. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-zinc-950 border-zinc-800 text-white flex h-full max-h-screen flex-col p-0 overflow-y-auto">
        <SheetHeader className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-k24-yellow" />
              Корзина
              {getTotalItems() > 0 && (
                <span className="text-sm font-normal text-zinc-400">
                  ({getTotalItems()} {getTotalItems() === 1 ? 'товар' : 'товари'})
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
              <p className="text-zinc-400 mb-2">Корзина порожня</p>
              <p className="text-sm text-zinc-600">
                Додайте товари до корзини
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800"
                  >
                    {/* Product Image */}
                    <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-zinc-800">
                      {item.product.images[0] ? (
                        <ProductImage
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col">
                      <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mb-2">
                        Артикул: {item.product.partNumber || '—'}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-k24-yellow">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-zinc-800 px-6 py-4 space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Контактна інформація
                </h3>
                <Input
                  placeholder="Ваше ім'я*"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
                <Input
                  placeholder="Телефон*"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
                <Input
                  placeholder="Email (опціонально)"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
                <Input
                  placeholder="Коментар до замовлення"
                  value={customerInfo.comment}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, comment: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <Separator className="bg-zinc-800" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">Всього:</span>
                <span className="text-2xl font-bold text-k24-yellow">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCheckout}
                  disabled={!customerInfo.name || !customerInfo.phone || isSubmitting}
                  className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Відправка...
                    </>
                  ) : (
                    'Оформити замовлення'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  Очистити корзину
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
