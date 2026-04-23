"use client";

const STORAGE_KEY = "omgim_client_key";

export function getClientKey(): string {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key = (crypto.randomUUID?.() ?? fallbackUuid()).replaceAll("-", "");
    localStorage.setItem(STORAGE_KEY, key);
  }
  return key;
}

function fallbackUuid() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
