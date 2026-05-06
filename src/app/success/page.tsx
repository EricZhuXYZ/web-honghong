import Link from "next/link";

function SuccessContent({
  checkoutId,
  orderId,
  subscriptionId,
}: {
  checkoutId?: string;
  orderId?: string;
  subscriptionId?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          支付成功！
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          感谢您的购买，您应该很快会收到一封确认邮件。
        </p>
        {checkoutId && (
          <p className="text-sm text-gray-400 mb-2">
            结算编号: {checkoutId}
          </p>
        )}
        {orderId && (
          <p className="text-sm text-gray-400 mb-2">
            订单编号: {orderId}
          </p>
        )}
        {subscriptionId && (
          <p className="text-sm text-gray-400 mb-6">
            订阅编号: {subscriptionId}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/profile"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            个人中心
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;

  const params: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (Array.isArray(value)) {
      params[key] = value[0];
    } else {
      params[key] = value;
    }
  }

  return (
    <SuccessContent
      checkoutId={params.checkout_id}
      orderId={params.order_id}
      subscriptionId={params.subscription_id}
    />
  );
}
