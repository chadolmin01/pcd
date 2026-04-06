import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-txt-primary mb-4">404</div>
          <div className="w-24 h-1 bg-surface-inverse mx-auto rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-txt-primary mb-4">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-txt-secondary mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          <br />
          URL을 확인하시거나 홈으로 돌아가 주세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-surface-inverse text-txt-inverse rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
