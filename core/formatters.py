"""TranscriptResult → txt/srt/vtt/json 변환."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from .engines.base import TranscriptResult, Utterance, Word


def to_txt(result: TranscriptResult) -> str:
    if result.utterances:
        lines = [u.text.strip() for u in result.utterances if u.text.strip()]
        return "\n\n".join(lines) + "\n"
    return result.text.strip() + "\n"


def to_srt(
    result: TranscriptResult,
    *,
    max_chars: int = 42,
    max_duration: float = 6.0,
) -> str:
    cues = _build_cues(result, max_chars=max_chars, max_duration=max_duration)
    blocks = []
    for idx, (start, end, text) in enumerate(cues, start=1):
        blocks.append(
            f"{idx}\n{_srt_timestamp(start)} --> {_srt_timestamp(end)}\n{text}\n"
        )
    return "\n".join(blocks)


def to_vtt(
    result: TranscriptResult,
    *,
    max_chars: int = 42,
    max_duration: float = 6.0,
) -> str:
    cues = _build_cues(result, max_chars=max_chars, max_duration=max_duration)
    parts = ["WEBVTT", ""]
    for start, end, text in cues:
        parts.append(f"{_vtt_timestamp(start)} --> {_vtt_timestamp(end)}")
        parts.append(text)
        parts.append("")
    return "\n".join(parts)


def to_json(result: TranscriptResult) -> str:
    payload = {
        "engine": result.engine,
        "model": result.model,
        "language": result.language,
        "duration_sec": result.duration_sec,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "text": result.text,
        "utterances": [_utterance_dict(u) for u in result.utterances],
        "words": [_word_dict(w) for w in result.words],
        "raw": result.raw,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _build_cues(
    result: TranscriptResult, *, max_chars: int, max_duration: float
) -> list[tuple[float, float, str]]:
    if result.words:
        return _cues_from_words(
            result.words, max_chars=max_chars, max_duration=max_duration
        )
    if result.utterances:
        return [
            (u.start, u.end, u.text.strip())
            for u in result.utterances
            if u.text.strip()
        ]
    return []


def _cues_from_words(
    words: tuple[Word, ...], *, max_chars: int, max_duration: float
) -> list[tuple[float, float, str]]:
    cues: list[tuple[float, float, str]] = []
    buf: list[Word] = []
    for w in words:
        if not buf:
            buf.append(w)
            continue
        joined = " ".join(x.text for x in buf + [w]).strip()
        span = w.end - buf[0].start
        if (
            len(joined) > max_chars
            or span > max_duration
            or _ends_sentence(buf[-1].text)
        ):
            cues.append(
                (buf[0].start, buf[-1].end, " ".join(x.text for x in buf).strip())
            )
            buf = [w]
        else:
            buf.append(w)
    if buf:
        cues.append((buf[0].start, buf[-1].end, " ".join(x.text for x in buf).strip()))
    return [(s, e, t) for s, e, t in cues if t]


def _ends_sentence(text: str) -> bool:
    return text.endswith((".", "?", "!", "。", "？", "！"))


def _srt_timestamp(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _vtt_timestamp(sec: float) -> str:
    return _srt_timestamp(sec).replace(",", ".")


def _utterance_dict(u: Utterance) -> dict:
    return {
        "start": u.start,
        "end": u.end,
        "speaker": u.speaker,
        "text": u.text,
        "words": [_word_dict(w) for w in u.words],
    }


def _word_dict(w: Word) -> dict:
    return {
        "text": w.text,
        "start": w.start,
        "end": w.end,
        "confidence": w.confidence,
        "speaker": w.speaker,
    }


FORMATTERS = {
    "txt": to_txt,
    "srt": to_srt,
    "vtt": to_vtt,
    "json": to_json,
}
