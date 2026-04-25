# omgim-yt — YouTube transcript worker

Vercel Functions 가 YouTube 봇 감지 시스템에 등록돼 모든 client 응답에서
captionTracks 가 빈 결과로 돌아오는 문제 우회용. Fly.io nrt 리전에서
공식 `youtube_transcript_api` 를 호출해 자막을 추출한다.

## 배포

```bash
cd projects/transcriber/yt-worker

# 1회: 로그인
flyctl auth login

# 1회: 앱 생성 (이미 있으면 스킵)
flyctl launch --name omgim-yt --region nrt --no-deploy --copy-config --yes

# 시크릿
flyctl secrets set WORKER_API_KEY="<32바이트 hex>" -a omgim-yt

# 배포
flyctl deploy -a omgim-yt
```

## API

### `GET /transcript?video_id=VIDEO_ID`

헤더: `X-API-Key: <WORKER_API_KEY>`

성공 (200):
```json
{
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "kind": "manual",
  "segments": [{"start": 1.36, "end": 3.04, "text": "[♪♪♪]"}],
  "plainText": "...",
  "durationSec": 211.32
}
```

실패 (4xx/5xx):
```json
{
  "detail": {"error": "no_captions", "message": "..."}
}
```

### `GET /health`

`{"ok": "true"}`

## 통합

Vercel `web/lib/youtube.ts` 가 1차로 이 worker 를 호출하고,
실패 시 기존 Innertube + youtube-transcript 체인으로 폴백.

env (Vercel):
- `YT_WORKER_URL=https://omgim-yt.fly.dev`
- `YT_WORKER_API_KEY=<32바이트 hex>`

## 비용

- Fly shared-cpu-1x 256mb, auto-stop = idle 시 0대
- 트래픽 발생 시에만 ~10초 wake-up + 평균 200ms 응답
- 예상: 월 $0~3 (사용량 따라)
