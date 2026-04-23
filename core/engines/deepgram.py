"""Deepgram Nova-3 어댑터.

요금: nova-3 Pay-as-you-go $0.0043/분 기준 (2026-04 공개가).
파일은 바이트 직접 업로드 (2GB 한도).
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import httpx

from .base import TranscriptResult, Utterance, Word

DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"
COST_PER_MINUTE_USD = 0.0043
MAX_RETRIES = 3
BASE_BACKOFF_SEC = 2.0
REQUEST_TIMEOUT_SEC = 1800.0  # 30분 — 큰 파일 업로드 여유


class DeepgramError(RuntimeError):
    pass


class DeepgramEngine:
    name = "deepgram"
    model = "nova-3"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        key = api_key or os.environ.get("DEEPGRAM_API_KEY")
        if not key:
            raise DeepgramError("DEEPGRAM_API_KEY 가 설정되지 않았습니다.")
        self._key = key
        if model:
            self.model = model

    def estimate_cost_usd(self, duration_sec: float) -> float:
        return (duration_sec / 60.0) * COST_PER_MINUTE_USD

    def transcribe(self, audio_path: Path, language: str) -> TranscriptResult:
        payload = audio_path.read_bytes()
        params = {
            "model": self.model,
            "smart_format": "true",
            "punctuate": "true",
            "utterances": "true",
        }
        if language and language != "auto":
            params["language"] = language
        else:
            params["detect_language"] = "true"

        content_type = _mime_for(audio_path)
        data = _post_with_retry(self._key, params, payload, content_type)
        return _parse(data, model=self.model)


def _post_with_retry(
    api_key: str,
    params: dict[str, str],
    payload: bytes,
    content_type: str,
) -> dict[str, Any]:
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT_SEC) as client:
                resp = client.post(
                    DEEPGRAM_URL,
                    params=params,
                    content=payload,
                    headers={
                        "Authorization": f"Token {api_key}",
                        "Content-Type": content_type,
                    },
                )
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in (429, 500, 502, 503, 504):
                raise DeepgramError(f"Deepgram {resp.status_code}: {resp.text[:300]}")
            raise DeepgramError(f"Deepgram {resp.status_code}: {resp.text[:300]}")
        except (httpx.HTTPError, DeepgramError) as e:
            last_err = e
            if attempt == MAX_RETRIES:
                break
            time.sleep(BASE_BACKOFF_SEC * (2 ** (attempt - 1)))
    raise DeepgramError(f"Deepgram 요청 최종 실패: {last_err}")


def _mime_for(path: Path) -> str:
    mapping = {
        ".m4a": "audio/mp4",
        ".mp4": "audio/mp4",
        ".aac": "audio/aac",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".flac": "audio/flac",
        ".ogg": "audio/ogg",
        ".opus": "audio/ogg",
        ".webm": "audio/webm",
    }
    return mapping.get(path.suffix.lower(), "application/octet-stream")


def _parse(data: dict[str, Any], *, model: str) -> TranscriptResult:
    metadata = data.get("metadata", {}) or {}
    results = data.get("results", {}) or {}
    channels = results.get("channels", []) or []
    alt = (channels[0].get("alternatives", [{}])[0] if channels else {}) or {}

    text = alt.get("transcript", "") or ""
    raw_words = alt.get("words", []) or []
    words = tuple(
        Word(
            text=w.get("punctuated_word") or w.get("word", ""),
            start=float(w.get("start", 0.0)),
            end=float(w.get("end", 0.0)),
            confidence=_maybe_float(w.get("confidence")),
            speaker=_maybe_int(w.get("speaker")),
        )
        for w in raw_words
    )

    raw_utts = results.get("utterances", []) or []
    utterances = tuple(
        Utterance(
            text=u.get("transcript", "") or "",
            start=float(u.get("start", 0.0)),
            end=float(u.get("end", 0.0)),
            speaker=_maybe_int(u.get("speaker")),
            words=tuple(
                Word(
                    text=w.get("punctuated_word") or w.get("word", ""),
                    start=float(w.get("start", 0.0)),
                    end=float(w.get("end", 0.0)),
                    confidence=_maybe_float(w.get("confidence")),
                    speaker=_maybe_int(w.get("speaker")),
                )
                for w in (u.get("words", []) or [])
            ),
        )
        for u in raw_utts
    )

    language = _detect_language(alt, metadata)
    duration = float(metadata.get("duration", 0.0) or 0.0)

    return TranscriptResult(
        text=text,
        words=words,
        utterances=utterances,
        language=language,
        engine="deepgram",
        model=model,
        duration_sec=duration,
        raw=data,
    )


def _detect_language(alt: dict, metadata: dict) -> str:
    for key in ("detected_language", "language"):
        val = alt.get(key) or metadata.get(key)
        if val:
            return str(val)
    return ""


def _maybe_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _maybe_int(v: Any) -> int | None:
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None
