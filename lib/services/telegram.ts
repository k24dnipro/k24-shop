/**
 * Telegram Bot API service
 * Sends order notifications to Telegram
 */

export interface OrderData {
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    comment?: string;
  };
  items: Array<{
    product: {
      id: string;
      name: string;
      partNumber?: string;
      // Храним базовую цену в USD, конвертируем в UAH при отображении.
      price: number;
      originalPrice?: number | null;
      brand?: string;
    };
    quantity: number;
  }>;
  totalPrice: number;
  totalItems: number;
}

/**
 * Send order notification to Telegram
 */
export async function sendTelegramOrder(order: OrderData): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'order', data: order }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export interface InquiryData {
  productId: string;
  productName: string;
  productPartNumber?: string;
  productStatus?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  /** Запропонована клієнтом ціна */
  proposedPrice?: number;
}

/**
 * Send inquiry notification to Telegram
 */
export async function sendTelegramInquiry(inquiry: InquiryData): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'inquiry', data: inquiry }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}
