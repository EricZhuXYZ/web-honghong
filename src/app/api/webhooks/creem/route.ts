import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

type WebhookEvent = {
  id: string;
  type: string;
  eventType: string;
  created_at: number;
  data: Record<string, unknown>;
  object: Record<string, unknown>;
};

function parseEvent(rawBody: string): WebhookEvent | null {
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function normalizeEvent(event: WebhookEvent) {
  const eventType = event.type || event.eventType || "";
  const payload = event.data || event.object || event;

  const order =
    (payload.order as Record<string, unknown>) ||
    (event.data as Record<string, unknown>) ||
    {};
  const customer =
    (payload.customer as Record<string, unknown>) ||
    (payload.customer_id
      ? { id: payload.customer_id }
      : undefined);
  const product =
    (payload.product as Record<string, unknown>) ||
    (payload.product_id
      ? { id: payload.product_id }
      : undefined);
  const subscription =
    (payload.subscription as Record<string, unknown>) ||
    (payload.subscription_id
      ? { id: payload.subscription_id }
      : undefined);
  const metadata = (payload.metadata ||
    (event.data as Record<string, unknown>)) as
    | Record<string, unknown>
    | undefined;

  return { eventType, payload, order, customer, product, subscription, metadata };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("creem-signature");
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

  console.log("收到 Webhook 请求体:", body.slice(0, 500));

  if (!signature || !webhookSecret) {
    console.error("缺少 webhook 签名或密钥");
    return NextResponse.json(
      { error: "缺少签名或密钥" },
      { status: 401 }
    );
  }

  if (!verifySignature(body, signature, webhookSecret)) {
    console.error("Webhook 签名验证失败");
    return NextResponse.json(
      { error: "签名验证失败" },
      { status: 401 }
    );
  }

  const event = parseEvent(body);
  if (!event) {
    console.error("Webhook 请求体 JSON 解析失败");
    return NextResponse.json(
      { error: "无效的请求体" },
      { status: 400 }
    );
  }

  const {
    eventType,
    payload,
    order,
    customer,
    product,
    subscription,
    metadata,
  } = normalizeEvent(event);

  console.log(`收到 Creem Webhook 事件: ${eventType}`, {
    eventId: event.id,
    payloadId: payload.id,
    customerId: customer?.id,
    customerEmail: customer?.email,
    productId: product?.id,
    productName: product?.name,
    orderId: order?.id,
    orderAmount: order?.amount,
    subscriptionId: subscription?.id,
    subscriptionStatus: subscription?.status,
    metadata,
  });

  try {
    switch (eventType) {
      case "checkout.completed": {
        console.log("支付完成，准备写入数据库");

        if (metadata?.userId) {
          await handleUserPaymentSuccess(
            metadata.userId as number,
            customer?.id as string,
            subscription?.id as string,
            product?.id as string
          );
        }
        break;
      }

      case "subscription.active":
      case "subscription.paid": {
        console.log(
          eventType === "subscription.paid" ? "订阅续费成功" : "新订阅激活"
        );

        if (metadata?.userId) {
          await handleSubscriptionPaid(
            metadata.userId as number,
            subscription?.id as string || payload.id as string,
            (subscription?.status || payload.status) as string
          );
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.scheduled_cancel": {
        console.log(
          eventType === "subscription.canceled"
            ? "订阅已取消"
            : "订阅已计划取消"
        );

        if (metadata?.userId) {
          await handleSubscriptionCanceled(
            metadata.userId as number,
            subscription?.id as string || payload.id as string,
            (subscription?.status || payload.status) as string
          );
        }
        break;
      }

      case "subscription.past_due":
        console.log("订阅逾期未付", {
          subscriptionId: payload.id,
        });
        break;

      case "subscription.expired":
        console.log("订阅已过期", {
          subscriptionId: payload.id,
        });
        break;

      case "subscription.paused":
      case "subscription.trialing": {
        console.log(
          eventType === "subscription.paused" ? "订阅已暂停" : "订阅试用中"
        );

        if (metadata?.userId) {
          await updateSubscriptionStatus(
            metadata.userId as number,
            (subscription?.status || payload.status) as string,
            subscription?.id as string || payload.id as string
          );
        }
        break;
      }

      case "refund.created":
        console.log("退款已创建", {
          refundId: payload.id,
          amount: payload.amount,
        });
        break;

      case "dispute.created":
        console.log("争议已创建", {
          disputeId: payload.id,
          reason: payload.reason,
        });
        break;

      default:
        console.log(`未处理的 Webhook 事件类型: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook 事件处理失败:", error);
    return NextResponse.json(
      { error: "事件处理失败" },
      { status: 500 }
    );
  }
}

async function handleUserPaymentSuccess(
  userId: number,
  creemCustomerId: string,
  subscriptionId: string,
  productId: string
) {
  const { default: pool } = await import("@/lib/db");
  await pool.query(
    `UPDATE users 
     SET creem_customer_id = COALESCE($2, creem_customer_id),
         subscription_status = 'active',
         subscription_id = $3,
         subscription_product_id = $4,
         subscription_updated_at = NOW()
     WHERE id = $1`,
    [userId, creemCustomerId, subscriptionId, productId]
  );
}

async function handleSubscriptionPaid(
  userId: number,
  subscriptionId: string,
  status: string
) {
  const { default: pool } = await import("@/lib/db");
  await pool.query(
    `UPDATE users 
     SET subscription_status = $2,
         subscription_id = $3,
         subscription_updated_at = NOW()
     WHERE id = $1`,
    [userId, status, subscriptionId]
  );
}

async function handleSubscriptionCanceled(
  userId: number,
  subscriptionId: string,
  status: string
) {
  const { default: pool } = await import("@/lib/db");
  await pool.query(
    `UPDATE users 
     SET subscription_status = $2,
         subscription_updated_at = NOW()
     WHERE id = $1 AND subscription_id = $3`,
    [userId, status, subscriptionId]
  );
}

async function updateSubscriptionStatus(
  userId: number,
  status: string,
  subscriptionId: string
) {
  const { default: pool } = await import("@/lib/db");
  await pool.query(
    `UPDATE users 
     SET subscription_status = $2,
         subscription_updated_at = NOW()
     WHERE id = $1 AND subscription_id = $3`,
    [userId, status, subscriptionId]
  );
}
