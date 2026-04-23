"""전사 엔진 공통 계약.

어댑터 패턴: 모든 엔진(Deepgram, Gemini, ...)은 TranscriptionEngine
프로토콜을 구현해 TranscriptResult 를 반환한다. CLI와 포매터는 엔진
종류를 모른다.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass(frozen=True)
class Word:
    text: str
    start: float
    end: float
    confidence: float | None = None
    speaker: int | None = None


@dataclass(frozen=True)
class Utterance:
    text: str
    start: float
    end: float
    speaker: int | None = None
    words: tuple[Word, ...] = ()


@dataclass(frozen=True)
class TranscriptResult:
    text: str
    words: tuple[Word, ...]
    utterances: tuple[Utterance, ...]
    language: str
    engine: str
    model: str
    duration_sec: float
    raw: dict[str, Any] = field(default_factory=dict)


class TranscriptionEngine(Protocol):
    name: str
    model: str

    def estimate_cost_usd(self, duration_sec: float) -> float: ...

    def transcribe(self, audio_path: Path, language: str) -> TranscriptResult: ...
