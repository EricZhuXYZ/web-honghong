import { NextRequest, NextResponse } from "next/server";
import { creem } from "@/lib/creem";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const { productId, successUrl, discountCode, metadata } = body;

    const targetProductId = productId || process.env.CREEM_PRODUCT_ID;

    if (!targetProductId) {
      return NextResponse.json(
        { error: "缺少 productId 参数" },
        { status: 400 }
      );
    }

    const checkout = await creem.checkouts.create({
      productId: targetProductId,
      requestId: user ? `user_${user.id}` : undefined,
      successUrl:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/success`,
      discountCode: discountCode || undefined,
      customer: user
        ? { email: undefined }
        : undefined,
      metadata: {
        userId: user?.id,
        username: user?.username,
        ...metadata,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      checkoutId: checkout.id,
    });
  } catch (error) {
    console.error("创建结算会话失败:", error);
    return NextResponse.json(
      { error: "创建结算会话失败，请稍后重试" },
      { status: 500 }
    );
  }
}
