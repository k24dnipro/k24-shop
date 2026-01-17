import {
  NextRequest,
  NextResponse,
} from 'next/server';
import {
  formatInquiryMessage,
  formatOrderMessage,
  InquiryData,
  OrderData,
} from '@/lib/services/telegram';

/**
 * POST /api/telegram
 * Sends order or inquiry notification to Telegram bot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Get Telegram bot configuration from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram bot configuration missing');
      return NextResponse.json(
        { error: 'Telegram bot not configured' },
        { status: 500 }
      );
    }

    let message: string;

    if (type === 'order') {
      const order: OrderData = data;
      
      // Validate required fields
      if (!order.customerInfo?.name || !order.customerInfo?.phone) {
        return NextResponse.json(
          { error: 'Missing required customer information' },
          { status: 400 }
        );
      }

      if (!order.items || order.items.length === 0) {
        return NextResponse.json(
          { error: 'Order must contain at least one item' },
          { status: 400 }
        );
      }

      // Format the message
      message = formatOrderMessage(order);
    } else if (type === 'inquiry') {
      const inquiry: InquiryData = data;
      
      // Validate required fields
      if (!inquiry.customerName || !inquiry.customerPhone || !inquiry.productName) {
        return NextResponse.json(
          { error: 'Missing required inquiry information' },
          { status: 400 }
        );
      }

      // Format the message
      message = formatInquiryMessage(inquiry);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "order" or "inquiry"' },
        { status: 400 }
      );
    }

    // Send message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Telegram API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send message to Telegram', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, messageId: result.result?.message_id });
  } catch (error) {
    console.error('Error processing Telegram notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
