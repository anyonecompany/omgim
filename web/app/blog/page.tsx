import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";
import { POSTS, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "블로그",
  description:
    "옮김(Omgim) 블로그 — YouTube 자막 추출, 한국어 음성 인식 비교, 회의 녹화 활용법 등 영상→텍스트 실무 가이드.",
};

export default function BlogIndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center px-5 border-b border-grey-200 bg-white">
        <Link
          href="/"
          className="text-[14px] font-semibold text-grey-900 tracking-tight hover:text-brand"
        >
          ← 옮김
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] px-5 py-10 space-y-8">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-grey-900">
            블로그
          </h1>
          <p className="mt-2 text-[14px] text-grey-500">
            영상을 텍스트로 옮기는 실무 가이드와 기술 메모.
          </p>
        </div>

        <ul className="space-y-6">
          {POSTS.map((post) => (
            <li
              key={post.slug}
              className="rounded-md border border-grey-200 bg-white p-5 hover:border-brand transition-colors"
            >
              <Link href={`/blog/${post.slug}`} className="block space-y-2">
                <p className="text-[12px] font-medium tracking-wide text-grey-400 tabular-nums">
                  {formatDate(post.publishedAt)} · {post.readMinutes}분 읽기
                </p>
                <h2 className="text-[18px] font-semibold leading-[26px] text-grey-900 hover:text-brand transition-colors">
                  {post.title}
                </h2>
                <p className="text-[14px] leading-[22px] text-grey-600">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-grey-100 px-2.5 py-0.5 text-[11px] text-grey-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
