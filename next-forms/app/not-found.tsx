import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h2>404 Not Found</h2>
      <p>ページが見つかりません</p>
      <Link
        href="/"
        className="my-3 mx-1 p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition cursor-pointer"
      >
        トップページに戻る
      </Link>
    </div>
  );
}