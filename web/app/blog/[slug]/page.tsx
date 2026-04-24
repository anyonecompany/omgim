import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/ui/Footer";
import { getAllSlugs, getPost, formatDate } from "@/lib/blog";

const SITE_URL = "https://omgim.xyz";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "ko-KR",
    url: `${SITE_URL}/blog/${slug}`,
    keywords: post.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
  };

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <header className="flex h-14 items-center px-5 border-b border-grey-200 bg-white">
        <Link
          href="/blog"
          className="text-[14px] font-semibold text-grey-900 tracking-tight hover:text-brand"
        >
          ← 블로그
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[680px] px-5 py-10 space-y-8">
        <div className="space-y-3">
          <p className="text-[12px] font-medium tracking-wide text-grey-400 tabular-nums">
            {formatDate(post.publishedAt)} · {post.readMinutes}분 읽기
          </p>
          <h1 className="text-[28px] font-bold leading-[38px] text-grey-900">
            {post.title}
          </h1>
          <p className="text-[15px] leading-[24px] text-grey-600">
            {post.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-grey-100 px-2.5 py-0.5 text-[11px] text-grey-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <article className="prose-omgim space-y-5 text-[15px] leading-[26px] text-grey-800">
          {post.body}
        </article>

        <hr className="border-grey-200" />

        <section className="rounded-md border border-grey-200 bg-grey-50 px-5 py-5 space-y-3">
          <p className="text-[14px] font-semibold text-grey-900">
            직접 써 보세요
          </p>
          <p className="text-[14px] text-grey-600">
            1.5시간 이상 영상을 약 1분 안에 한국어 텍스트로 옮길 수 있어요.
            무료 · 로그인 불필요.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover"
          >
            옮김으로 이동
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
