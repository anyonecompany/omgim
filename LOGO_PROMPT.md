# 옮김 (Omgim) — Logo Brief & Prompts

> 출력 대상: Midjourney v6 / Ideogram 3.0 / Flux Pro / DALL·E 3 / ChatGPT Image
> 디자인 기준 문서: `design-system/transcriber/MASTER.md` (Toss 기반)

---

## 1. 핵심 아이덴티티

| 항목 | 값 |
|------|------|
| 제품명 (한) | 옮김 |
| 제품명 (영) | Omgim |
| 태그라인 | 영상을 글로 옮깁니다 |
| 카테고리 | AI 음성 전사 서비스 (Korean speech-to-text SaaS) |
| 타겟 | 한국어 화자, 1.5시간+ 장시간 영상을 텍스트로 옮기려는 크리에이터/팀 |

## 2. 로고 원칙 (MASTER.md 기반)

**반드시 지킬 것**
- **절제(Restraint)**: 단색 위주, 단일 레이어. "Restraint communicates trust" (금융·지식 서비스 수준의 신뢰감)
- **컬러 팔레트**: `#191F28` (Dark Charcoal — 메인 글자) · `#FFFFFF` (Background) · `#EF4444` (Brand Red — 포인트 1점만)
- **타이포 기준**: Pretendard Variable 계열 geometric sans-serif. 한글·라틴 광학 밸런스 유지
- **라디우스**: 아이콘 배경 있을 경우 8–16px 둥근 모서리
- **플랫**: gradient 금지 · shadow 금지 · 3D 금지 · bevel 금지 · 메탈릭 금지 · 글리터 금지

**의미 상징**
- "옮김" = 옮기다 (이동·전달). 소리가 글자로 **옮겨지는 순간**
- 한글 ㅁ (네모) 2개 = "옮"·"김" 양쪽에 있음 → 두 개의 텍스트 블록/프레임 은유 가능
- ㅇ (원) = 음성·파장 시작점

## 3. 프롬프트 — 3가지 변형

### A. 워드마크 (가로형, 웹 헤더용)

```
Minimalist Korean wordmark logo for "옮김" (Omgim), a premium AI speech-to-text service for long-form Korean video.
Two Hangul characters "옮김" set in a modern geometric sans-serif (Pretendard-style) with precise optical balance between Korean and Latin proportions.
Deep charcoal #191F28 letterforms on pure white background.
Single brand-red #EF4444 accent — a small round dot placed above or beside "김" as if marking the moment sound becomes text.
Flat, no gradients, no shadows, no 3D, no texture. Pixel-perfect geometry.
Confident, calm, Toss-level restraint. Generous negative space. Professional SaaS identity.
Composition: centered or slight left-align, 16:9 horizontal canvas.
--ar 16:9 --style raw --v 6
```

### B. 심볼 / 앱 아이콘 (정사각, 파비콘·앱 뱃지용)

```
App icon for 옮김 (Omgim), a Korean AI transcription service.
Single Hangul character "옮" in a deep charcoal #191F28, bold geometric sans-serif, centered inside a rounded-square tile (14px corner radius) on pure white background.
A single small #EF4444 red circular dot floats at the upper-right of "옮", symbolizing the instant of voice-to-text capture — like a recording indicator frozen at the moment of transcription.
Flat icon, one layer, no gradient, no drop shadow. Mobile-ready at 1024x1024.
Style: Toss · Stripe · Linear — restrained, confident, premium.
--ar 1:1 --style raw --v 6
```

### C. 컨셉 마크 (소리→글 이동 시각화)

```
Abstract logotype concept for "옮김" — a horizontal line of three small dotted sound-wave marks on the left, smoothly transitioning into two clean horizontal text-baseline lines on the right. Charcoal #191F28 geometry with a single bright brand-red #EF4444 accent dot at the exact transformation point in the middle. Paired below with "옮김" wordmark in Pretendard-style sans-serif, charcoal. Flat vector style, no gradients, Swiss-typography precision. Pure white background. Zero ornament.
--ar 4:3 --style raw --v 6
```

## 4. 금지 규칙 (Negative prompts)

```
no gradient, no 3D, no bevel, no emboss, no glow, no metallic, no shadow,
no realistic photography, no mascot, no cartoon character, no pig, no piggy bank,
no hands, no faces, no microphones (literal), no speech bubble, no quotation marks,
no red–orange gradient (mistaken for AdaptFit), no cerulean blue (Toss knockoff),
no english-only — Hangul 옮김 must be primary
```

## 5. 산출물 체크리스트

생성된 로고가 아래 기준을 만족해야 한다:

- [ ] 한글 "옮김"이 명확히 읽힘 (획 간섭 없음)
- [ ] `#EF4444` 포인트가 정확히 1군데만 사용됨
- [ ] `#191F28` 이외의 검정/회색 없음
- [ ] 흰 배경에서 대비 충분 (WCAG AA 이상)
- [ ] 24×24 px까지 축소해도 "옮" 글자 형태가 살아있음 (파비콘 테스트)
- [ ] 1 색 버전(검정 단색)으로 변환해도 정체성 유지
- [ ] 회사 다른 서비스 브랜드와 명확히 구분됨

## 6. 파일 포맷 요구 (디자이너 전달 시)

| 용도 | 포맷 | 사이즈 |
|------|------|--------|
| 웹 헤더 로고 | SVG + PNG (2×) | 가변 |
| 앱 아이콘 | SVG + PNG | 1024×1024, 512, 256, 192, 180 (Apple), 32 (favicon) |
| OG 이미지 | PNG | 1200×630 (`web/public/og.png` 경로) |
| 다크 모드 변형 | SVG | 흰 글자 + 빨간 포인트 |

## 7. 바로 쓸 수 있는 추천 프롬프트 (한 줄)

**Midjourney**:
```
옮김 Korean wordmark logo, minimalist geometric Hangul sans-serif, charcoal #191F28 letters on white, single #EF4444 red dot accent, flat vector, Toss-style restraint --ar 16:9 --style raw --v 6
```

**Ideogram** (문자 렌더링 강함):
```
Logo wordmark "옮김" in modern Korean sans-serif, dark charcoal with one small red dot accent, clean flat design, minimalist, premium SaaS brand, white background
```

**DALL·E 3 / ChatGPT Image**:
```
Create a minimalist professional logo for a Korean AI transcription service called "옮김" (Omgim). Use two Hangul characters styled in a clean geometric sans-serif similar to Pretendard. Primary color: deep charcoal (#191F28). Place a single small bright red (#EF4444) dot as the only accent, near or above the character "김", symbolizing the moment voice becomes text. Pure white background. Flat design, no gradients, no shadows. Style reference: Toss, Linear, Stripe logos — restrained, confident, trustworthy.
```
