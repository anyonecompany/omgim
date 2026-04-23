# 옮김 (Omgim)

> 영상을 글로 옮깁니다.

장시간 영상(1.5시간+) → 텍스트 변환 도구. 내부 디렉토리·코드 경로는 하위 호환을 위해 `transcriber` 이름을 유지합니다.

- **Phase 0**: 로컬 CLI (완료)
- **Phase 1**: 웹 UI (`web/`) — 진행 중

## 빠른 시작 (5분)

```bash
cd projects/transcriber
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# .env에 DEEPGRAM_API_KEY, GEMINI_API_KEY 입력
# Deepgram 키: https://console.deepgram.com/
# Gemini 키: https://aistudio.google.com/apikey

python transcribe.py /path/to/video.mp4
```

기본 출력: `outputs/video.txt` + `outputs/video.srt`

## 사용법

```bash
python transcribe.py INPUT [옵션]

옵션:
  --lang ko|en|auto        언어 (기본 ko)
  --engine deepgram|gemini 엔진 (기본 deepgram)
  --format txt,srt,vtt,json 출력 포맷 쉼표 구분 (기본 txt,srt)
  --output-dir outputs     출력 디렉토리
  --keep-audio             추출한 오디오 파일 보존
```

### 예시

```bash
# 90분 강연 → 텍스트만
python transcribe.py lecture.mp4 --format txt

# 자막용 SRT + 원본 JSON
python transcribe.py interview.mp4 --format srt,json

# Gemini로 재처리 (품질 비교)
python transcribe.py lecture.mp4 --engine gemini --format txt
```

## 비용 (90분 영상 기준)

| 엔진 | 모델 | 90분 비용 |
|------|------|----------|
| Deepgram | nova-3 | ≈ $0.39 |
| Gemini | gemini-2.0-flash | ≈ $0.01 이하 |

실제 비용은 실행 시 stdout에 추정값이 표시됩니다.

## 지원 입력

영상: `.mp4`, `.mov`, `.webm`, `.mkv`, `.avi`
오디오: `.mp3`, `.m4a`, `.wav`, `.aac`, `.flac`, `.ogg`

입력이 영상이면 ffmpeg으로 16kHz mono m4a로 추출 후 전사합니다.

## 요구 사항

- Python 3.11+
- ffmpeg, ffprobe (`brew install ffmpeg`)
- 유효한 Deepgram 또는 Gemini API 키

## Phase 로드맵

- **Phase 0 (현재)**: 로컬 CLI
- **Phase 1**: 개인 웹 툴 (Next.js + Vercel)
- **Phase 2**: SaaS화 (인증·결제·화자분리·요약)
