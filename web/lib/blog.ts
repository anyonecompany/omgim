import type { ReactNode } from "react";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO 날짜
  updatedAt?: string;
  readMinutes: number;
  tags: string[];
  body: ReactNode;
}

// 각 글은 content/blog/<slug>.tsx 에서 export 한 post 를 여기서 합쳐 index 생성.
import { post as youtubeWays } from "@/content/blog/youtube-transcript-ways";
import { post as meetingGuide } from "@/content/blog/meeting-transcription-guide";
import { post as sttCompare } from "@/content/blog/korean-stt-comparison";

export const POSTS: BlogPost[] = [
  youtubeWays,
  meetingGuide,
  sttCompare,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function getPost(slug: string): BlogPost | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
