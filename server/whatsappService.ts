/**
 * WhatsApp Business API Service
 * Abstraction layer for WhatsApp messaging.
 * In development/mock mode, messages are logged to console instead of sent.
 * To enable real sending: set WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID env vars.
 *
 * Supported providers: Meta (Cloud API), Twilio, 360dialog
 * Current default: mock mode (logs to console)
 */

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const isMockMode = (): boolean => {
  return !process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_NUMBER_ID;
};

/**
 * Send a WhatsApp text message.
 * In mock mode: logs the message to console and returns success.
 * In real mode: sends via Meta Cloud API.
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<SendResult> {
  const { to, body } = message;

  if (isMockMode()) {
    console.log(`[WhatsApp MOCK] → ${to}`);
    console.log(`[WhatsApp MOCK] Message:\n${body}`);
    console.log(`[WhatsApp MOCK] ─────────────────────────────────────`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const apiKey = process.env.WHATSAPP_API_KEY!;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`WhatsApp API error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error: any) {
    console.error("[WhatsApp] Send error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send messages to multiple recipients.
 * Returns count of successful sends.
 */
export async function sendBulkWhatsAppMessages(
  phones: string[],
  body: string,
  delayMs: number = 200
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const phone of phones) {
    const result = await sendWhatsAppMessage({ to: phone, body });
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(`${phone}: ${result.error}`);
    }
    if (delayMs > 0 && sent + failed < phones.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { sent, failed, errors };
}

/**
 * Format a morning newsletter message for WhatsApp.
 */
export function formatNewsletterMessage(opts: {
  title: string;
  points: string[];
  readMoreUrl?: string;
  date?: string;
}): string {
  const { title, points, readMoreUrl, date } = opts;
  const dateStr = date || new Date().toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const lines: string[] = [
    `🌿 *كبسولة الصباح الصحية*`,
    `📅 ${dateStr}`,
    ``,
    `*${title}*`,
    ``,
  ];

  points.forEach((point, i) => {
    lines.push(`${i + 1}. ${point}`);
  });

  lines.push(``);

  if (readMoreUrl) {
    lines.push(`📖 اقرأ المزيد: ${readMoreUrl}`);
    lines.push(``);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`للإلغاء أرسل: *إيقاف*`);

  return lines.join("\n");
}

/**
 * Format the welcome/confirmation message.
 */
export function formatWelcomeMessage(name?: string): string {
  const greeting = name ? `مرحباً ${name}! 🌿` : `مرحباً! 🌿`;
  return [
    greeting,
    ``,
    `شكراً لاشتراكك في *كبسولة الصباح الصحية* من منصة كبسولة.`,
    ``,
    `ستصلك رسالة صحية يومية مختصرة ومفيدة كل صباح تحتوي على:`,
    `✅ أبرز أخبار الصحة`,
    `✅ نصائح صحية مخصصة لاهتماماتك`,
    `✅ روابط للمزيد من التفاصيل`,
    ``,
    `للتأكيد أرسل: *نعم*`,
    `للإلغاء في أي وقت أرسل: *إيقاف*`,
  ].join("\n");
}

export function getApiMode(): "mock" | "meta" {
  return isMockMode() ? "mock" : "meta";
}
