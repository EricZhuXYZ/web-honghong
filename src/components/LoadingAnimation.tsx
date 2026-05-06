export default function LoadingAnimation() {
  return (
    <div className="flex gap-1.5 py-1">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "0ms" }} />
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "200ms" }} />
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "400ms" }} />
    </div>
  );
}
