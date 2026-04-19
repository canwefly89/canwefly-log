---
title: "\"로컬에서는 됐는데요\" — 배포 직전 한 달간 마주친 4가지 함정"
description: "async/def, AV1 코덱, 병렬화 ROI, SDK 호환. 파이썬 생태계에서 '로컬에서는 됐다'가 얼마나 약한 근거인지."
date: "2026-04-19"
slug: "local-worked-four-traps"
tags: ["pi-lab", "fastapi", "python", "deployment", "infra"]
series:
  id: "pi-lab-intensive"
  name: "PI Lab 8주 과정"
  order: 5
  total: 6
---

## 들어가기 전에

이 글은 **파이프라인이 로컬에서 완벽하게 돌다가, 배포 또는 동시성 테스트에서 조용히 무너지는 순간들**에 대한 기록이다. 8주 동안 RAG와 멀티모달 시스템을 올리면서 발견한 네 가지 함정 — 전부 **"로컬에서는 됐는데요"** 라는 문장에서 시작한다.

특히 JS/TS 배경의 개발자가 빠지기 쉬운 지점을 중심으로 모았다. 파이썬의 비동기 모델, 네이티브 바인딩의 플랫폼 차이, "호환" 표방 SDK의 실제 동작 — 모두 기존 프론트엔드 감각으로 접근하면 어디선가 반드시 터진다.

<br>

## 에피소드 1 — `async def`를 썼는데 서버가 통째로 멈췄다

### 증상

RAG 시스템을 올리던 중이었다. 사용자가 PDF를 업로드하면 서버가 파싱·청킹·임베딩해서 Supabase(pgvector)에 저장하는 파이프라인. 로컬에서 잘 돌던 서버에 14MB PDF 하나를 올려봤다.

그리고 **다른 탭에서 `/api/health`를 찔러봤는데 응답이 없었다.**

- `/api/sessions` — 응답 없음
- 이미 열려 있던 채팅 창 — 메시지 안 나감
- 업로드가 끝난 **직후에야** 밀려 있던 요청들이 한꺼번에 응답

프론트엔드 6년 동안 "API가 느리다"는 민원은 수도 없이 받아봤지만, **서버 전체가 한 요청 때문에 멈추는** 경험은 처음이었다.

### 원인

의심을 쭉 쳐내고 보니, 문제는 엔드포인트 선언 자체에 있었다.

```python
# Before — 문제 버전
@router.post("/api/sessions/{id}/upload")
async def upload_document(id: str, file: UploadFile):
    content = await file.read()           # ← 유일한 await
    parsed = parse_pdf(content)           # ← JVM 호출 (동기, 수십 초)
    enriched = enrich_figures(parsed)     # ← Vision API (동기, 수 분)
    for chunk in chunks:
        emb = get_embedding(chunk)        # ← OpenAI 호출 (동기, 루프)
    save_document_chunks(...)             # ← Supabase (동기)
```

겉보기엔 요즘 파이썬 스타일이다. 근데 이게 **썩 좋은 조합은 아니었다.**

### FastAPI의 `async def` vs `def`

FastAPI를 한두 번 써본 사람이 놓치기 쉬운 디테일.

| 선언 | 실행 위치 | 블로킹 코드의 영향 |
|---|---|---|
| `async def` | **메인 이벤트 루프 스레드에서 직접 실행** | 이벤트 루프 **전체를 점유** → 다른 요청 전부 대기 |
| `def` (동기) | FastAPI가 자동으로 **스레드풀에서 실행** | 이벤트 루프는 자유. 스레드 1개만 점유 |

즉 `async def`는 "비동기라서 빠르다"가 아니라, **안에 있는 코드가 전부 `await`로 양보하는 진짜 비동기 코드일 때만** 의미가 있다.

내 코드에서 `await`는 `file.read()` 딱 하나였고, 나머지 수십 초짜리 작업(JVM 호출, Vision API, 임베딩 루프)은 전부 **동기 블로킹 코드**였다. 그걸 `async def` 안에 넣어두니, **이벤트 루프가 업로드되는 내내 그대로 막혀버린** 것이다.

### JS와 Python 비동기의 미묘한 차이

JS/TS 출신이 왜 여기에 잘 빠지냐면, 두 언어의 비동기 모델이 **비슷한 이름**을 갖고 있지만 **내부 동작이 다르기 때문**이다.

| 항목 | JavaScript | Python |
|---|---|---|
| I/O 기본 동작 | **자동 비동기** (`fetch()` 등) | **기본 동기** (`requests.post()` 등) |
| 비동기 I/O | 별도 설정 불필요 | `httpx.AsyncClient` 등 **별도 라이브러리 필요** |
| `async` 안의 블로킹 호출 | 애초에 드물다 | **꽤 흔하다** (많은 SDK가 동기) |

JS에서는 `async function` 안에서 블로킹 I/O를 부르는 일 자체가 드물다. Python에서는 **많은 생태계 라이브러리가 아직 동기 SDK**다. `async def` 안에서 그냥 불러도 문법 오류가 안 난다는 게 함정이다.

### 해결 — 2단계 전환

**Stage 1**: 업로드 엔드포인트를 `def`로 되돌림.

```python
# After
@router.post("/api/sessions/{id}/upload")
def upload_document(id: str, file: UploadFile):   # async 제거
    content = file.file.read()                     # await 제거
    parsed = parse_pdf(content)
    ...
```

이것만으로 다른 요청이 막히지 않게 됐다. FastAPI가 이 함수를 스레드풀에서 실행하므로, 메인 이벤트 루프는 다른 요청을 계속 받는다. 동시에 `anyio` 스레드풀 상한을 **기본 40 → 100으로** 확장.

**Stage 2**: 반대로 채팅 경로는 **진짜 비동기**로 올림. 채팅은 LLM 스트리밍을 처리하므로 async가 유리한 케이스.

```python
# providers/llm.py — async 함수 추가
async def chat_stream_async(messages):
    async for chunk in client.chat.completions.stream(...):
        yield chunk
```

Supabase 호출은 아직 동기 SDK밖에 없어서 `asyncio.to_thread()`로 스레드풀에 위임.

### 측정

14MB PDF 업로드 중(120초 소요) 다른 요청들의 응답 시간:

```
[health@0.3s]   0.002s — PASS
[sessions@0.5s] 0.163s — PASS
[health@1.0s]   0.002s — PASS
[sessions@2.0s] 0.167s — PASS

결과: ALL PASS — 블로킹 없음 ✅
```

### 교훈

1. **`async def`는 "진짜 비동기"일 때만 쓴다.** 블로킹 호출이 섞여 있으면 `def`가 안전하다.
2. **FastAPI의 `def`는 자동으로 스레드풀에서 실행된다.** 블로킹 작업을 굳이 백그라운드 태스크로 뽑아내지 않아도 이벤트 루프는 자유다.
3. **엔드포인트 성격별로 실행 모델이 달라야 한다.** 업로드는 `def`, 채팅 스트리밍은 `async def`. 하나의 정답이 없다.

이 함정 하나 풀면서 "파이썬 async는 JS async가 아니다"라는 감각이 생겼다. 그리고 이건 단발성 교훈이 아니라 **이후 멀티모달 파이프라인에서 여러 번 다시 등장한 주제**였다. 이후 멀티모달 파이프라인에서는 반대 방향의 문제가 생겼다 — 영상 Q&A 엔드포인트가 `async def`인데 내부는 동기 ML 호출(임베딩·검색·LLM)이 연쇄된 구조라, 같은 "이벤트 루프 블로킹" 증상이 다시 나타났다. 이번에는 엔드포인트를 `def`로 바꾸는 게 아니라 **각 동기 호출을 `loop.run_in_executor()`로 스레드풀에 위임**하는 쪽으로 풀었다. 뒤에 나올 에피소드 3의 `asyncio.Semaphore` 이야기는 이 `async def + run_in_executor` 맥락 위에서 이어진다.

<br>

## 에피소드 2 — 로컬에서는 되던 비전 분석이, 배포에서는 조용히 빠져 있었다

### 증상

멀티모달 파이프라인을 Railway에 배포했다. 영상 업로드 → 오디오 추출 → STT → 프레임 추출 → Vision 분석 → 임베딩 → 저장의 흐름. 로컬(macOS)에서는 100% 잘 돌던 파이프라인이었다.

그런데 배포 후 테스트를 해보니, **비전 프레임 분석이 전혀 실행되지 않는다.** 에러가 나는 것도 아니었다. 로그에는 업로드 성공, STT 성공이 찍히는데, 비전 단계에서는 아무 일도 없이 넘어간다.

원본 파일이 잘못됐나? 새 영상으로 다시 업로드. 똑같은 증상.

### 디버깅

로컬 환경에서는 계속 잘 된다. 똑같은 코드, 똑같은 영상. 차이는 **로컬 macOS vs 배포 Linux (Docker)** 뿐이다.

프레임 추출 부분을 뜯어봤다.

```python
# extract_key_frames — 문제의 핵심
import cv2

cap = cv2.VideoCapture(video_path)
# ... 프레임 샘플링 ...
```

`cv2.VideoCapture`의 반환값을 찍어보니, 로컬에서는 `True`(열기 성공), 배포에서는 `False`(열기 실패). 같은 영상인데.

코덱을 확인해봤다. **AV1 코덱**. 최근 유튜브에서 다운받은 영상이 기본적으로 AV1로 인코딩되어 있었다.

### 진짜 원인 — cv2가 자기만의 FFmpeg을 들고 있다

이 부분이 파이썬 생태계의 고유한 함정이었다.

```
시스템 FFmpeg (apt-get install ffmpeg)  ≠  cv2가 사용하는 FFmpeg
```

`pip install opencv-python-headless` 시 **FFmpeg이 패키지에 번들링된다.** 그리고 Linux용 pip wheel은 패키지 크기 최소화를 위해 **AV1 디코더를 제외하고 빌드**된다.

**macOS wheel은 AV1 디코더를 포함**하고 있어서 로컬에선 문제없이 작동. Linux wheel은 미포함. 같은 `opencv-python-headless==4.10.0.84` 버전이라도 **플랫폼별로 내부 구성이 다른 것**이다.

파이썬 C/C++ 바인딩 패키지의 오래된 특성이다. JS의 npm 패키지처럼 "한 번 깔면 모든 환경에서 똑같이 동작"이라는 감각으로 접근하면 어디선가 이런 문제를 만나게 된다. 이번 케이스는 에러 메시지도 조용한 편이라 원인을 잡는 데 시간이 좀 걸렸다.

### 해결 — 역할 분담

원인을 알고 나니 해결은 간단했다. `extract_key_frames`를 **cv2에서 ffmpeg-python으로** 전환.

```python
# Before — cv2 내장 FFmpeg (AV1 미지원)
import cv2
cap = cv2.VideoCapture(video_path)

# After — 시스템 ffmpeg 서브프로세스 호출
import ffmpeg
ffmpeg.input(video_path).filter('fps', fps=1).output(...).run()
```

서브프로세스로 **시스템 ffmpeg을 호출**하니 모든 코덱을 지원한다. 이미 오디오 추출 단계에서는 이 패턴을 쓰고 있었는데, 프레임 추출에도 같은 패턴을 적용하면 됐다.

### 교훈

1. **"로컬에서는 된다"는 배포 환경 테스트 부재의 신호일 뿐이다.** 파이썬 C 바인딩 패키지(cv2, tensorflow, torch, pillow 등)는 **플랫폼별 wheel 빌드에 따라 기능 차이가 발생**한다. PyPI 같은 버전이라도 macOS와 Linux wheel 내부 구성이 다를 수 있다.

2. **비디오 처리는 역할 분담이 안전하다.** 디코딩은 `ffmpeg` (시스템 바이너리), 이미지 연산은 `cv2`. 이렇게 나누면 환경 의존성이 확 줄어든다.

3. **원인을 몰랐으면 "그냥 배포가 원래 이래" 하고 넘어갔을 것이다.** 실무에서 이런 종류의 이슈를 "알 수 없는 배포 오류"로 치부하는 경우가 얼마나 많을까 싶었다. 디버깅의 출발은 "이게 왜 되지?"와 "왜 안 되지?"를 **둘 다** 묻는 것.

<br>

## 에피소드 3 — 병렬화 코드는 그대로였는데, 효과가 14배 달랐다

### 맥락

멀티모달 파이프라인은 세 가지 무거운 작업을 순차 실행한다.

1. STT — 영상에서 오디오 추출 후 Whisper로 전사
2. 프레임 분석 — 1초당 1프레임 샘플링 후 Vision 모델로 각 프레임 설명 생성
3. 세그먼트 저장 — 전사 결과 청크별로 임베딩 후 Supabase에 저장

24분짜리 뉴스 영상을 **로컬(CPU) 순차 처리**로 돌렸더니 **15분 8초** 걸렸다. 재생 시간보다 긴 처리 시간은 실서비스에서 안 된다.

그래서 병렬화를 적용했다. 앞서 에피소드 1에서 언급한 `async def + run_in_executor` 구조 위에, `asyncio.gather`로 STT와 프레임 파이프라인을 **동시에** 실행하고, `asyncio.Semaphore`로 프레임 분석을 **3개씩**, 세그먼트 저장을 **5개씩** 동시 호출하도록 제한했다. 각 Vision/임베딩 호출은 내부적으로 `run_in_executor`를 거쳐 스레드풀로 넘어가지만, 바깥 `async` 계층에서는 여러 호출을 동시에 띄울 수 있는 구조다.

### 결과 — 환경별 ROI가 14배 차이

| 환경 | 병렬화 전 | 병렬화 후 | 절감 | 효과 |
|---|---|---|---|---|
| **로컬 (CPU-bound)** | 908초 | 861초 | -47초 | **5.2% 단축** |
| **배포 (I/O-bound)** | 238초 | 70초 | -168초 | **70.6% 단축** |

같은 병렬화 코드인데 **로컬에서는 거의 효과가 없었고, 배포에서는 크게 줄었다.**

### 원인 — CPU 경합 vs I/O bound

**로컬 환경의 병목은 CPU/GPU 자원 경합**이었다.

- STT (faster-whisper): 로컬 CPU 점유
- Vision (Ollama + gemma3): 로컬 CPU/GPU 점유
- 둘을 `gather`로 동시 실행하면, **서로 같은 리소스를 다투게** 된다
- 결과: STT가 순차 실행 대비 **오히려 44% 느려짐** (9분50초 → 14분13초)

**배포 환경의 작업은 전부 원격 API 호출**이었다.

- STT: Groq API
- Vision: Gemini 2.5 Flash API
- Embedding: HuggingFace Inference API
- 전부 I/O bound → 클라이언트에서는 **거의 자원 소비 없이 대기만** 하다가 결과 받음
- 병렬로 여러 요청을 날려도 서로 간섭하지 않음
- 결과: 병렬화 효과 극대화

### 더 흥미로운 발견 — 외부 `gather`보다 내부 `Semaphore`가 중요

병렬화 기여도를 쪼개보니 이랬다.

| 병렬화 유형 | 절감 시간 | 기여도 |
|---|---|---|
| STT ↔ 프레임 파이프라인 (`gather`) | 9초 | **5.4%** |
| **프레임 분석 내부 3개씩 동시** (`Semaphore`) | **115초** | **68.5%** |
| **세그먼트 저장 5개씩 동시** (`Semaphore`) | **40초** | **23.8%** |

25장 프레임을 순차 호출하느냐 3개씩 동시 호출하느냐의 차이가 크게 났다. 파이프라인 단위의 병렬화보다 **작업 단위의 동시 호출**이 훨씬 효과적이다.

### 어디까지 올릴 수 있을까 — rate limit과의 균형

동시성을 더 올리면 이론상 더 빨라진다. 근데 외부 API는 rate limit이 있다.

- Gemini Flash: **15 RPM (requests per minute)**
- HuggingFace Inference API: 티어별 상이
- Supabase: connection pool 고려

`MAX_CONCURRENT_VISION=3`, `MAX_CONCURRENT_EMBED=5`로 세팅한 이유가 여기다. 더 올리면 **429 Too Many Requests**가 터지고, exponential backoff로 결국 더 느려진다. 이 숫자는 **실험으로만 찾을 수 있는 값**이다.

최종 성능: 24분 영상을 **1분 10초**에 처리 → **20.6배 배속**. 순수 로컬 대비 13배 개선.

### 교훈

1. **병렬화의 ROI는 작업의 성격에 종속적이다.** CPU-bound 작업을 병렬화해도 자원이 없으면 오히려 느려진다. I/O-bound 작업은 병렬화가 거의 무료 점심이다.
2. **"로컬에서 성능 측정"은 왜곡되기 쉽다.** 실서비스의 성능 특성은 로컬에서는 드러나지 않는다. 내 경우도 로컬에서 "병렬화 별 효과 없네" 하고 넘어갔으면, 배포의 최적 성능을 못 봤을 것이다.
3. **파이프라인 레벨 병렬화보다 작업 레벨 동시성이 ROI가 크다.** 순차 호출되는 N개의 API 콜이 있다면, 그걸 Semaphore로 동시에 돌리는 것부터 먼저 하자.
4. **동시성 레벨은 실험으로만 찾는다.** 너무 낮으면 느리고, 너무 높으면 429로 더 느리다. 이 숫자는 문서에 없다.

<br>

## 에피소드 4 — "OpenAI 호환"이라더니, 속 타입이 달랐다

이 에피소드는 앞 세 가지에 비하면 짧다. 하지만 앞으로 외부 SDK를 연동할 때마다 반복해서 떠오르는 종류의 교훈이었다.

배포 환경에서 STT를 로컬 `faster-whisper`에서 **Groq의 `whisper-large-v3-turbo`**로 전환했다. Groq은 공식적으로 **"OpenAI Whisper API 호환"**을 표방한다. 그래서 로컬에서 OpenAI Whisper를 쓰던 코드를 거의 그대로 가져갈 수 있겠다 싶었다.

배포하자마자 이런 에러.

```
AttributeError: 'dict' object has no attribute 'start'
  at line: segment_start = segment.start
```

로컬에서 OpenAI SDK를 쓸 때는 `segment.start`, `segment.end`, `segment.text`처럼 **객체 속성**으로 접근했는데, Groq SDK는 같은 필드를 **딕셔너리**로 반환하고 있었다.

```python
# OpenAI SDK
response.segments[0].start     # 객체 속성

# Groq SDK (OpenAI "호환")
response.segments[0]["start"]  # dict 키
```

"API 호환"이라는 말의 범위가 **Wire protocol 수준(HTTP 엔드포인트·JSON 스키마 동일)**과 **SDK 수준(언어 SDK의 메서드·타입까지 동일)** 사이 어디에 있는지에 따라, 이런 차이가 생긴다. Groq이 약속한 건 Wire 수준이지, **Python SDK가 JSON을 `dict`로 감쌀지 Pydantic 모델로 감쌀지**까지는 아니었다.

해결은 두 단계로 했다. 당장은 `dict`/객체 양쪽을 받을 수 있도록 방어적 헬퍼를 하나 끼워 넣고,

```python
def _get(s, key):
    return s[key] if isinstance(s, dict) else getattr(s, key)
```

근본적으로는 **Provider 추상화 레이어에서 모든 응답을 프로젝트 내부 표준 `dict` 타입으로 통일**하도록 했다. `providers/llm.py`, `providers/vision.py` 같은 어댑터가 SDK 차이를 흡수하고, 라우트 로직은 항상 동일한 형태의 객체를 받는다. 이 규칙만 지키면 SDK 교체가 거의 무료가 된다 — 배포 직전에 `gemini-2.0-flash`가 신규 사용자 대상에서 폐기돼서 `gemini-2.5-flash`로 옮길 때도, 어댑터 한 줄만 바꿨다.

이 에피소드에서 남는 한 줄은 이거다. **"호환"이라는 단어를 보면, 실응답 JSON과 객체를 한 번은 찍어본다.** 이 한 줄이 쌓여서 나중에 3년치 유지보수 난이도를 바꾼다.

<br>

## 네 가지 함정의 공통점

네 에피소드를 관통하는 한 가지는 이거다.

> **"파이썬 생태계에서 '로컬에서는 됐다'는 것은, 배포에서도 될 거라는 근거가 되지 못한다."**

- 비동기 모델은 JS와 미묘하게 다르고 (에피소드 1)
- 같은 PyPI 패키지라도 플랫폼별 wheel 내부가 다르고 (에피소드 2)
- 작업의 CPU/IO 특성에 따라 병렬화 ROI가 14배 차이 나고 (에피소드 3)
- "호환 API"라고 해도 SDK 응답 타입이 다를 수 있다 (에피소드 4)

이 네 가지는 **튜토리얼에서는 절대 만날 수 없는 문제**들이다. 튜토리얼은 항상 "정상 경로"만 보여준다. 실제 서비스 레벨로 올라가면서 만나는 이런 함정들이야말로, **실무 감각의 핵심**이라고 생각하게 됐다. 그리고 이 감각은 혼자 공부로는 거의 쌓을 수 없는 종류다. 누군가의 장애 기록을 읽거나, 직접 서버를 띄워 보거나, 페어와 디버깅을 함께 해야 겨우 박힌다.

FE 6년의 경험으로 "이 정도 에러 해결은 가능하지" 라고 접근했는데, 위 네 가지는 전부 **프런트엔드 감각으로는 예측 불가능한 함정**들이었다. 백엔드·데이터·ML 레이어로 내려가 보면, 같은 "엔지니어링"이라도 **다른 체급의 문제들**이 있다는 걸 알게 됐다.

<br>

## 다음 편

런타임·인프라 레이어의 이야기는 여기까지. 마지막 편은 앞의 다섯 편을 한 장의 지도로 정리한 **실무 구축 플레이북**이다.

- **6편** — [회사에서 "RAG 붙여주세요" 했을 때 — 내가 쓰는 4-Phase 구축 플레이북](/posts/rag-playbook-four-phases)
  문제 정의 → MVP → 평가 체계 → 고도화 → 프로덕션 하드닝의 4-Phase 순서로, 다음에 누군가 RAG를 만들 때 꺼내 쓸 수 있는 형태로 정리.

이번 편의 인프라 함정들은 6편 Phase 4 (프로덕션 하드닝)에서 다시 한 번 짧게 등장한다.

<br>

---

*프론트엔드 6년차 개발자가 [PI Lab](https://paaa.ai/)에서 AI 엔지니어링 8주 과정을 수료하며 정리한 기록입니다. 매일 Cursor·Claude로 바이브코딩하면서도 머신러닝 안쪽은 잘 몰랐던 개발자가, AI 시스템을 본격적으로 들여다본 회고입니다.*
