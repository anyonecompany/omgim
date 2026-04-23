"""장시간 영상 → 텍스트 CLI.

사용: python transcribe.py INPUT [--lang ko] [--engine deepgram] [--format txt,srt]
"""

from __future__ import annotations

import argparse
import sys
import tempfile
import time
from pathlib import Path

from dotenv import load_dotenv

from core import audio
from core.engines.base import TranscriptionEngine, TranscriptResult
from core.formatters import FORMATTERS

DEFAULT_FORMATS = "txt,srt"
DEFAULT_OUTPUT_DIR = "outputs"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="transcribe",
        description="장시간 영상/오디오 파일을 텍스트로 전사한다.",
    )
    p.add_argument("input", type=Path, help="영상 또는 오디오 파일 경로")
    p.add_argument("--lang", default="ko", help="언어 코드 (ko/en/ja/auto). 기본 ko")
    p.add_argument(
        "--engine",
        default="deepgram",
        choices=["deepgram", "gemini"],
        help="전사 엔진. 기본 deepgram",
    )
    p.add_argument(
        "--format",
        default=DEFAULT_FORMATS,
        help=f"출력 포맷 쉼표 구분 (txt,srt,vtt,json). 기본 {DEFAULT_FORMATS}",
    )
    p.add_argument(
        "--output-dir",
        type=Path,
        default=Path(DEFAULT_OUTPUT_DIR),
        help=f"출력 디렉토리. 기본 {DEFAULT_OUTPUT_DIR}",
    )
    p.add_argument(
        "--keep-audio",
        action="store_true",
        help="추출한 중간 오디오 파일을 보존",
    )
    p.add_argument(
        "--model",
        default=None,
        help="엔진 모델 오버라이드 (예: nova-3, gemini-2.0-flash)",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    args = build_parser().parse_args(argv)

    src: Path = args.input
    if not src.exists():
        _die(f"입력 파일을 찾을 수 없습니다: {src}")
    if not src.is_file():
        _die(f"파일이 아닙니다: {src}")

    formats = [f.strip().lower() for f in args.format.split(",") if f.strip()]
    unknown = [f for f in formats if f not in FORMATTERS]
    if unknown:
        _die(f"지원하지 않는 포맷: {unknown}. 가능: {sorted(FORMATTERS)}")

    args.output_dir.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    _log(f"[1/4] 입력 점검: {src.name}")
    duration = _safe_probe(src)
    _log(f"      길이 ≈ {_fmt_duration(duration)}")

    engine = _build_engine(args.engine, model=args.model)
    est = engine.estimate_cost_usd(duration)
    _log(f"      엔진={engine.name} 모델={engine.model} 예상비용 ≈ ${est:.4f}")

    audio_path, tmpdir = _prepare_audio(src)
    try:
        _log(
            f"[2/4] 오디오 준비 완료: {audio_path.name} ({audio_path.stat().st_size / 1_000_000:.1f} MB)"
        )

        _log("[3/4] 전사 요청… (장시간 파일은 몇 분 소요)")
        t_trans = time.time()
        result = engine.transcribe(audio_path, args.lang)
        _log(f"      완료. 전사 소요 {time.time() - t_trans:.1f}s")

        _log("[4/4] 포맷 변환 및 저장")
        outputs = _write_outputs(result, src, formats, args.output_dir)
        for path in outputs:
            _log(f"      → {path}")

        if args.keep_audio:
            kept = args.output_dir / f"{src.stem}.m4a"
            kept.write_bytes(audio_path.read_bytes())
            _log(f"      → {kept} (오디오 보존)")
    finally:
        if tmpdir is not None:
            tmpdir.cleanup()

    total = time.time() - t0
    _log(f"\n완료. 총 소요 {total:.1f}s / 예상비용 ≈ ${est:.4f}")
    return 0


def _prepare_audio(src: Path) -> tuple[Path, tempfile.TemporaryDirectory | None]:
    if audio.is_audio_file(src):
        return src, None
    tmpdir = tempfile.TemporaryDirectory(prefix="transcriber-")
    dst = Path(tmpdir.name) / f"{src.stem}.m4a"
    audio.extract_audio(src, dst)
    return dst, tmpdir


def _build_engine(name: str, *, model: str | None) -> TranscriptionEngine:
    if name == "deepgram":
        from core.engines.deepgram import DeepgramEngine

        return DeepgramEngine(model=model)
    if name == "gemini":
        from core.engines.gemini import GeminiEngine

        return GeminiEngine(model=model)
    _die(f"알 수 없는 엔진: {name}")


def _write_outputs(
    result: TranscriptResult,
    src: Path,
    formats: list[str],
    out_dir: Path,
) -> list[Path]:
    written: list[Path] = []
    for fmt in formats:
        body = FORMATTERS[fmt](result)
        dst = out_dir / f"{src.stem}.{fmt}"
        dst.write_text(body, encoding="utf-8")
        written.append(dst)
    return written


def _safe_probe(path: Path) -> float:
    try:
        return audio.probe_duration(path)
    except audio.AudioToolError as e:
        _die(str(e))


def _fmt_duration(sec: float) -> str:
    h, rem = divmod(int(sec), 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}시간 {m}분 {s}초"
    return f"{m}분 {s}초"


def _log(msg: str) -> None:
    print(msg, flush=True)


def _die(msg: str) -> "None":
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    sys.exit(main())
