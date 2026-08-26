import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { xenditWebhookEvents } from "../db/schema";

export type XenditInvoiceParams = {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
};

export type XenditInvoiceResult = {
  id: string;
  invoiceUrl: string;
  status: string;
};

function getXenditSecret(): string {
  const secret = process.env.XENDIT_SECRET_KEY ?? process.env.XENDIT_API_KEY;
  if (secret === undefined || secret.length === 0) {
    throw new Error("XENDIT_SECRET_KEY is required");
  }
  return secret;
}

function getWebhookToken(): string {
  const token = process.env.XENDIT_WEBHOOK_TOKEN;
  if (token === undefined || token.length === 0) {
    return "";
  }
  return token;
}

export function verifyWebhookToken(headers: Headers): boolean {
  const token = getWebhookToken();
  if (token.length === 0) {
    return true;
  }
  const incoming = headers.get("x-callback-token");
  if (incoming === null) {
    return false;
  }
  return incoming === token;
}

export async function isDuplicateWebhook(eventId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select()
    .from(xenditWebhookEvents)
    .where(eq(xenditWebhookEvents.eventId, eventId));
  return rows.length > 0;
}

export async function recordWebhookEvent(
  eventId: string,
  tenantId: string | null,
  status: string,
  payload: Record<string, string>,
): Promise<void> {
  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(xenditWebhookEvents).values({
    id,
    eventId,
    tenantId,
    status,
    payload,
  });
}

export async function createInvoice(params: XenditInvoiceParams): Promise<XenditInvoiceResult> {
  const secret = getXenditSecret();
  const credentials = Buffer.from(`${secret}:`).toString("base64");
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Xendit createInvoice failed: ${response.status} ${text}`);
  }
  // SAFETY: Xendit API returns {id, invoice_url, status} per docs, response.ok checked
  const data = (await response.json()) as { id: string; invoice_url: string; status: string };
  return { id: data.id, invoiceUrl: data.invoice_url, status: data.status };
}
