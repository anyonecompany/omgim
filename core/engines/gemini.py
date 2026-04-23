"""Gemini 2.0 Flash 어댑터.

Google GenAI SDK 로 오디오 파일을 업로드해 전사 프롬프트를 실행한다.
장시간 파일은 Files API 로 업로드 후 참조. 타임스탬프 추출은
세그먼트 단위(`[mm:ss]` 프롬프트)로만 지원하며, 단어 단위는
제공하지 않는다.
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any

from .base import TranscriptResult, Utterance

MODEL = "gemini-2.0-flash"
# 추정치: 오디오 입력 ≈ 32 tokens/sec, gemini-2.0-flash 입력 $0.075/1M tokens
COST_PER_SEC_USD = 32 * 0.075 / 1_000_000
POLL_INTERVAL_SEC = 2.0
POLL_TIMEOUT_SEC = 600.0

PROMPT = (
    "다음 오디오를 주어진 언어({lang})로 정확히 받아쓰기 하라. "
    "아래 JSON 스키마 그대로 반환한다. 다른 텍스트는 포함하지 마라.\n"
    '{{"text": "전체 텍스트(문장 단위 개행)",'
    ' "segments": [{{"start": 초, "end": 초, "text": "세그먼트 텍스트"}}]}}'
    "\nstart/end 는 오디오 시작 기준 초(float). 언어가 auto 면 자동 판별."
)


class GeminiError(RuntimeError):
    pass


class GeminiEngine:
    name = "gemini"
    model = MODEL

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        try:
            from google import genai
        except ImportError as e:
            raise GeminiError(
                "google-genai 가 설치되지 않았습니다. requirements.txt 확인."
            ) from e

        key = api_key or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise GeminiError("GEMINI_API_KEY 가 설정되지 않았습니다.")
        self._client = genai.Client(api_key=key)
        if model:
            self.model = model

    def estimate_cost_usd(self, duration_sec: float) -> float:
        return duration_sec * COST_PER_SEC_USD

    def transcribe(self, audio_path: Path, language: str) -> TranscriptResult:
        uploaded = self._upload(audio_path)
        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=[uploaded, PROMPT.format(lang=language or "auto")],
            )
        finally:
            try:
                self._client.files.delete(name=uploaded.name)
            except Exception:
                pass

        return _parse(response, language=language, model=self.model)

    def _upload(self, audio_path: Path):
        uploaded = self._client.files.upload(file=audio_path)
        start = time.time()
        while getattr(uploaded, "state", None) and str(uploaded.state).endswith(
            "PROCESSING"
        ):
            if time.time() - start > POLL_TIMEOUT_SEC:
                raise GeminiError("Gemini 파일 처리 타임아웃")
            time.sleep(POLL_INTERVAL_SEC)
            uploaded = self._client.files.get(name=uploaded.name)
        if str(getattr(uploaded, "state", "")).endswith("FAILED"):
            raise GeminiError("Gemini 파일 처리 실패")
        return uploaded


def _parse(response: Any, *, language: str, model: str) -> TranscriptResult:
    text = getattr(response, "text", "") or ""
    payload = _extract_json(text)

    full_text = (payload.get("text") or "").strip()
    segments = payload.get("segments") or []
    utterances = tuple(
        Utterance(
            text=str(s.get("text", "")).strip(),
            start=float(s.get("start", 0.0) or 0.0),
            end=float(s.get("end", 0.0) or 0.0),
        )
        for s in segments
        if str(s.get("text", "")).strip()
    )
    if not full_text and utterances:
        full_text = "\n".join(u.text for u in utterances)

    return TranscriptResult(
        text=full_text,
        words=(),
        utterances=utterances,
        language=language or "",
        engine="gemini",
        model=model,
        duration_sec=0.0,
        raw={"response_text": text},
    )


def _extract_json(text: str) -> dict:
    if not text:
        return {}
    # 코드펜스 제거
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else text
    # 첫 `{` 부터 마지막 `}` 까지 추출
    first = candidate.find("{")
    last = candidate.rfind("}")
    if first == -1 or last == -1 or last <= first:
        return {"text": text}
    try:
        return json.loads(candidate[first : last + 1])
    except json.JSONDecodeError:
        return {"text": text}
