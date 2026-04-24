import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-grey-200 bg-white px-5 py-6">
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-2 text-center">
        <p className="text-[13px] font-semibold text-grey-700">옮김 · Omgim</p>
        <nav
          aria-label="정책 링크"
          className="flex items-center gap-3 text-[12px] text-grey-500"
        >
          <Link
            href="/terms"
            className="hover:text-grey-900 transition-colors"
          >
            이용약관
          </Link>
          <span className="text-grey-300">·</span>
          <Link
            href="/privacy"
            className="hover:text-grey-900 transition-colors"
          >
            개인정보 처리방침
          </Link>
        </nav>
        <p className="text-[12px] text-grey-400">
          © 옮김. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
