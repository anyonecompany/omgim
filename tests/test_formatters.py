"""Fake 엔진 결과로 포매터 4종을 검증한다."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.engines.base import TranscriptResult, Utterance, Word
from core.formatters import to_json, to_srt, to_txt, to_vtt


def _sample() -> TranscriptResult:
    words = (
        Word("안녕하세요.", 0.0, 1.2, 0.98),
        Word("이것은", 1.3, 1.8, 0.95),
        Word("테스트입니다.", 1.9, 2.8, 0.97),
        Word("두", 3.0, 3.2, 0.99),
        Word("번째", 3.3, 3.7, 0.99),
        Word("문장.", 3.8, 4.2, 0.99),
    )
    utterances = (
        Utterance("안녕하세요. 이것은 테스트입니다.", 0.0, 2.8, words=words[:3]),
        Utterance("두 번째 문장.", 3.0, 4.2, words=words[3:]),
    )
    return TranscriptResult(
        text="안녕하세요. 이것은 테스트입니다. 두 번째 문장.",
        words=words,
        utterances=utterances,
        language="ko",
        engine="fake",
        model="fake-1",
        duration_sec=4.5,
        raw={"debug": True},
    )


def test_txt_uses_utterances() -> None:
    out = to_txt(_sample())
    assert "안녕하세요. 이것은 테스트입니다." in out
    assert "두 번째 문장." in out
    assert out.count("\n\n") == 1  # 두 utterance 사이 빈 줄


def test_srt_has_valid_structure() -> None:
    out = to_srt(_sample())
    assert out.startswith("1\n00:00:00,000 -->")
    assert "-->" in out
    blocks = [b for b in out.split("\n\n") if b.strip()]
    assert len(blocks) >= 1


def test_vtt_header() -> None:
    out = to_vtt(_sample())
    assert out.startswith("WEBVTT")


def test_json_roundtrip() -> None:
    out = to_json(_sample())
    data = json.loads(out)
    assert data["engine"] == "fake"
    assert data["model"] == "fake-1"
    assert data["language"] == "ko"
    assert len(data["utterances"]) == 2
    assert len(data["words"]) == 6
    assert data["raw"] == {"debug": True}


def run_all() -> None:
    tests = [
        test_txt_uses_utterances,
        test_srt_has_valid_structure,
        test_vtt_header,
        test_json_roundtrip,
    ]
    failures: list[str] = []
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
        except AssertionError as e:
            failures.append(f"{t.__name__}: {e}")
            print(f"  FAIL  {t.__name__}: {e}")
    if failures:
        raise SystemExit(1)
    print(f"\n{len(tests)} passed")


if __name__ == "__main__":
    run_all()
