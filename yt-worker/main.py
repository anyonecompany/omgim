"""YouTube transcript worker.

Fly.io 에서 실행되는 단일 목적 워커. Vercel Functions 가 봇으로
인식돼 captionTracks 를 빈 결과로 받는 문제를 우회하기 위해,
가정 사용자 IP 와 동급 평판인 Fly nrt 리전에서 youtube_transcript_api
를 호출해 자막을 추출한다.
"""

from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    VideoUnplayable,
)

app = FastAPI(title="omgim-yt", version="1.0.0")

WORKER_API_KEY = os.environ.get("WORKER_API_KEY", "")


class Segment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptResponse(BaseModel):
    videoId: str
    language: str
    kind: Literal["manual", "asr"]
    segments: list[Segment]
    plainText: str
    durationSec: float


class ErrorResponse(BaseModel):
    error: Literal[
        "no_captions",
        "video_not_found",
        "video_private",
        "region_blocked",
        "fetch_failed",
        "unauthorized",
    ]
    message: str


def _check_auth(x_api_key: str | None) -> None:
    if not WORKER_API_KEY:
        return
    if x_api_key != WORKER_API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true"}


@app.get(
    "/transcript",
    response_model=TranscriptResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def transcript(
    video_id: str,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> TranscriptResponse:
    _check_auth(x_api_key)

    if not video_id or len(video_id) != 11:
        raise HTTPException(
            status_code=400,
            detail={"error": "video_not_found", "message": "Invalid videoId"},
        )

    api = YouTubeTranscriptApi()
    try:
        transcript_list = api.list(video_id)
    except VideoUnavailable:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "video_not_found",
                "message": "Video is unavailable or removed",
            },
        )
    except VideoUnplayable as e:
        msg = str(e).lower()
        if "private" in msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "video_private",
                    "message": "Video is private",
                },
            )
        raise HTTPException(
            status_code=451,
            detail={
                "error": "region_blocked",
                "message": "Video is unplayable (region or other restriction)",
            },
        )
    except TranscriptsDisabled:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "no_captions",
                "message": "Transcripts disabled by uploader",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "fetch_failed",
                "message": f"{type(e).__name__}: {str(e)[:200]}",
            },
        )

    selected = None
    selected_kind: Literal["manual", "asr"] = "manual"
    for langs in (["ko"], ["en"]):
        try:
            t = transcript_list.find_manually_created_transcript(langs)
            selected = t
            selected_kind = "manual"
            break
        except NoTranscriptFound:
            continue
    if selected is None:
        for langs in (["ko"], ["en"]):
            try:
                t = transcript_list.find_generated_transcript(langs)
                selected = t
                selected_kind = "asr"
                break
            except NoTranscriptFound:
                continue
    if selected is None:
        try:
            for t in transcript_list:
                selected = t
                selected_kind = "asr" if t.is_generated else "manual"
                break
        except Exception:
            selected = None

    if selected is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "no_captions",
                "message": "No transcript track available",
            },
        )

    try:
        fetched = selected.fetch()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "fetch_failed",
                "message": f"fetch: {type(e).__name__}: {str(e)[:200]}",
            },
        )

    segments: list[Segment] = []
    duration_sec = 0.0
    for snip in fetched:
        text = (snip.text or "").strip()
        if not text:
            continue
        start = float(snip.start)
        end = start + float(snip.duration)
        if end > duration_sec:
            duration_sec = end
        segments.append(Segment(start=start, end=end, text=text))

    if not segments:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "no_captions",
                "message": "Transcript track is empty",
            },
        )

    plain_text = " ".join(s.text for s in segments)

    return TranscriptResponse(
        videoId=video_id,
        language=selected.language_code,
        kind=selected_kind,
        segments=segments,
        plainText=plain_text,
        durationSec=duration_sec,
    )
