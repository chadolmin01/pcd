export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-border rounded-full" />
          <div className="absolute inset-0 border-4 border-surface-inverse rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-txt-secondary font-medium">로딩 중...</p>
      </div>
    </div>
  );
}
