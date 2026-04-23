"""영상/오디오 파일에서 16kHz mono m4a 로 변환하고 길이를 조회한다."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".aac", ".flac", ".ogg", ".opus"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".flv", ".wmv"}


class AudioToolError(RuntimeError):
    pass


def _require(tool: str) -> str:
    path = shutil.which(tool)
    if not path:
        raise AudioToolError(
            f"{tool} 이 설치되어 있지 않습니다. macOS: `brew install ffmpeg`"
        )
    return path


def probe_duration(path: Path) -> float:
    """ffprobe 로 미디어 길이(초)를 조회한다."""
    ffprobe = _require("ffprobe")
    out = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        capture_output=True,
        text=True,
    )
    if out.returncode != 0:
        raise AudioToolError(f"ffprobe 실패: {out.stderr.strip()}")
    data = json.loads(out.stdout or "{}")
    duration = data.get("format", {}).get("duration")
    if duration is None:
        raise AudioToolError(f"길이를 파악할 수 없는 파일: {path}")
    return float(duration)


def extract_audio(src: Path, dst: Path) -> Path:
    """src(영상/오디오) → dst(16kHz mono m4a). 덮어쓴다."""
    ffmpeg = _require("ffmpeg")
    dst.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(src),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "aac",
            "-b:a",
            "64k",
            str(dst),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise AudioToolError(f"ffmpeg 추출 실패:\n{result.stderr[-1000:]}")
    return dst


def is_audio_file(path: Path) -> bool:
    return path.suffix.lower() in AUDIO_EXTS


def is_video_file(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTS
