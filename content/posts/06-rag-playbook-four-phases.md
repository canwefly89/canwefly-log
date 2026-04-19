---
title: "회사에서 \"RAG 붙여주세요\" 했을 때 — 내가 정리해본 4-Phase 구축 순서"
description: "문제 정의 → MVP → 평가 체계 → 고도화 → 프로덕션 하드닝. 8주 동안 한 사이클씩 굴려보면서 '다음엔 이 순서를 따라가보고 싶다' 싶은 단계를 정리했습니다."
date: "2026-04-19"
slug: "rag-playbook-four-phases"
tags: ["pi-lab", "rag", "ai"]
series:
  id: "pi-lab-intensive"
  name: "PI Lab 8주 과정"
  order: 6
  total: 6
---

## 들어가기 전에

이 글은 8주 동안 RAG·멀티모달 시스템을 한 사이클씩 굴려보면서, **"다음에 비슷한 일을 만나면 어떤 순서로 가는 게 좋겠다"** 싶은 단계를 정리한 것이다. 정답이라기보다, 내가 직접 부딪힌 끝에 "이 순서로 갔으면 헛돈 시간을 줄였겠다" 싶은 회고에 가깝다. 같은 길을 처음 가는 분들에게 한 장의 지도쯤 되면 좋겠다.

> 정식 MLOps 실무를 오래 한 입장이 아니라, **학습 사이클에서 직접 굴려보며 알게 된 범위 안에서** 적었다. 더 나은 패턴이 있을 수 있고, 회사 규모·도메인에 따라 안 맞는 부분도 있을 거다.

<br>

## 전체 지도

```
Phase 0 ─ 문제 정의와 성공 지표 잡기        (1~3일)
   │
   ▼
Phase 1 ─ MVP 파이프라인 (일단 작동)        (1~2주)
   │
   ▼
Phase 2 ─ 평가 체계 확립                   (3~5일)
   │
   ▼
Phase 3 ─ 품질 고도화                       (2~4주, 반복)
   │
   ▼
Phase 4 ─ 프로덕션 하드닝                   (1~2주)
```

이 순서를 만들면서 가장 크게 의식한 건 — **Phase 2(평가 체계)를 먼저 잡고 Phase 3(고도화)에 들어가야**, 이후 실험 결과를 숫자로 분간할 수 있다는 점이었다. 이걸 건너뛰고 고도화부터 하면 "감"으로만 판단하게 돼서, 8주 동안 가장 자주 후회한 지점이었다.

<br>

## Phase 0 — 문제 정의와 성공 지표 (1~3일)

가장 가볍게 보이지만 건너뛰면 나중에 비싸진 단계. 이걸 안 하고 Phase 1로 넘어갔더니 3주 뒤에 "근데 이게 뭐가 되면 성공인 거지?" 라는 질문에 답을 못 했다.

### 정리해야 할 4가지

| 질문 | 예시 답변 |
|---|---|
| 사용자는 누구인가 | 사내 CS 팀 직원 30명 / 외부 고객 수천 명 |
| 어떤 문서를 다루는가 | PDF / HWP / 노션 / 슬랙 대화 로그 |
| 어떤 질문을 하는가 | 사실 조회 / 요약 / 비교 / 의사결정 지원 |
| 틀렸을 때의 비용은? | 내부 보조 도구 (관대) / 법무·의료 (엄격) |

"틀렸을 때의 비용" 축이 가장 중요했다. 이게 낮으면 LLM 호출 한 방으로도 충분하고, 이게 높으면 리트리버 + 리랭커 + 출처 인용 + 환각 거부까지 다 필요하다. 이 축을 먼저 정하지 않으면 Phase 3에서 어디까지 손볼지 결정이 안 된다.

### 측정 가능한 지표로 내려보기

요구사항을 측정 가능한 지표로 번역하는 작업이 같이 필요하다. "개선됐다" 라는 말을 나중에 어떻게 증명할지를 앞에서 정해두는 셈.

- **비즈니스 KPI**: "CS 응대 시간 30% 감소", "고객 자가 해결률 50%"
- **프록시 지표 (엔지니어링 영역)**:
  - 정답률 (Golden set 기준)
  - 환각 거부 성공률 (모르는 질문에 "모른다"고 답하는 비율)
  - 응답 시간 p50 / p95
  - 비용 — 질의당 토큰·Vision 호출 수

KPI ↔ 프록시 지표 매핑을 한 페이지짜리 문서로 남겨두면, 나중에 "지표는 올랐는데 체감은 별로다" 같은 상황에서 원인 분석의 출발점이 된다.

<br>

## Phase 1 — MVP 파이프라인 (1~2주)

목표는 단순하다. **"사용자가 문서를 올리면 답이 나온다"** 가 일단 굴러가게 만드는 것. 품질은 Phase 3에서 올린다.

### MVP 최소 스택

```
[파싱]     pdfplumber 또는 opendataloader-pdf*
[청킹]     LangChain RecursiveCharacterTextSplitter (기본 1000 / 200 오버랩)
[임베딩]   bge-m3 (로컬) 또는 text-embedding-3-small (OpenAI)
[벡터DB]   Supabase pgvector (무료 티어로 충분)
[검색]     코사인 유사도 top-k=5
[LLM]      gpt-4o-mini (초기 실험) → gpt-4o (최종)
[API]      FastAPI + SSE 스트리밍
```

> \* `opendataloader-pdf`는 Java 11+ 기반 오픈소스 PDF 파서. **페이지 경계를 넘는 표 처리**에 강점이 있어 보고서·논문에서 효과가 컸다. PyPI가 아니라 GitHub(`opendataloader-project/opendataloader-pdf`) 기반 설치라 러닝 커브가 있으니, 일반 케이스라면 pdfplumber로 시작해도 충분하다.

### 스택 선택 시 참고한 기준

| 항목 | 저렴·쉬움 → 비쌈·강력 |
|---|---|
| 임베딩 | Ollama(bge-m3, 무료) → OpenAI → HuggingFace Inference |
| LLM | gpt-4o-mini / llama3.1 → gpt-4o → Claude Opus |
| 벡터DB | Supabase pgvector → Qdrant / Weaviate → Pinecone |
| PDF 파싱 | pdfplumber (간단) → Unstructured (구조 인식) → opendataloader-pdf (페이지 경계 표 특화, Java 필요) |

처음부터 유료 API로 가지 않으려고 했다. Ollama 로컬로 한 바퀴 태워본 뒤, 검증된 시점에서만 API로 전환. 학습 사이클에서는 이 원칙으로 비용을 많이 줄였다.

### Provider 추상화 — 처음에 심으면 편한 패턴

8주 동안 가장 잘했다고 생각한 것 중 하나. **Provider를 역할별로 분리해서 환경변수로 갈아끼우는 구조**를 처음부터 잡았다.

```python
# config.py — 역할별로 Provider 독립 스위칭
EMBED_PROVIDER = "ollama"    # ollama | openai | huggingface
EMBED_MODEL    = "bge-m3"
EMBED_DIM      = 1024        # ⚠️ DB 스키마 vector(N) 와 반드시 일치

LLM_PROVIDER = "openai"      # openai | ollama
LLM_MODEL    = "gpt-4o-mini"

EVAL_PROVIDER = "openai"     # 평가용 LLM을 메인과 분리 가능
EVAL_MODEL    = "gpt-4o"
```

```python
# providers/embedding.py — 호출측은 Provider를 모른다
def get_embedding(text: str) -> list[float]:
    if EMBED_PROVIDER == "ollama":
        return _ollama_embed(text)
    elif EMBED_PROVIDER == "openai":
        return _openai_embed(text)
    elif EMBED_PROVIDER == "huggingface":
        return _hf_embed(text)
```

이걸 안 잡고 가다가 나중에 분리하려면 호출하는 코드 전체를 손봐야 한다. 처음부터 분리해두니, 모델·프로바이더 교체가 환경변수 한 줄 바꾸는 일이 됐다.

### 재현성 체크리스트

학습용 사이드 프로젝트라도 챙기면 한참 뒤에도 다시 돌릴 수 있다.

- [ ] `.env.example` 커밋 (실제 `.env`는 gitignore)
- [ ] Python 버전 고정 (`pyenv local 3.11`)
- [ ] 의존성 락 (Pipfile.lock / poetry.lock)
- [ ] DB 스키마는 버전별 SQL 파일로 (`01-document-chunks-bge-m3-1024.sql`)
- [ ] 임베딩 모델명·차원을 README에 명시

<br>

## Phase 2 — 평가 체계 확립 (3~5일, 건너뛰지 않으려고 의식한 단계)

8주 동안 가장 후회를 줄여준 단계. 이걸 안 잡고 Phase 3에 들어갔더니 "청크 크기 512 → 256으로 바꿨더니 좋아진 것 같다" 같은 식의 감 위주 판단만 남았다. 평가 체계가 서고 나서야 비로소 "무엇을 바꿔야 하는가" 라는 질문에 숫자로 답할 수 있게 됐다.

### 2-1. Golden Set 구축 (반나절)

- 실제 데이터에서 Q&A 30~100개를 손으로 작성
- 각 항목: `질문 / 기대 답변 / 기대 출처(있다면)`
- 쉬운 사실 조회 + 표 질문 + 환각 유도 질문(문서에 없는 내용) 섞기
- 포맷은 `cases.jsonl` 로 버전 관리

```json
{"id": "c01", "question": "2024년 매출 합계는?", "expected": "12.3억 원", "category": "sum"}
{"id": "c02", "question": "CEO의 취미는?", "expected": "문서에 없음 (환각 거부 테스트)", "category": "refuse"}
```

### 2-2. 자동 채점 (Eval Harness)

```python
# eval/harness.py 대략적 구조
def run_eval(cases_path, config):
    results = []
    for case in load_cases(cases_path):
        answer, sources = rag_pipeline(case["question"], config)
        score = judge(case["expected"], answer)
        results.append({"case_id": case["id"], "score": score, ...})
    return summarize(results)
```

8주 동안 이 단계에서 익힌 원칙 3가지:

1. **변수 1개만 바꾼다.** 청크 크기·임베딩 모델·top-k 를 동시에 바꾸면 원인 분리가 안 된다.
2. **반복 실행한다.** LLM은 비결정적이라, 1회 결과는 노이즈일 가능성이 크다. 최소 3회 돌려 분산을 본다.
3. **실험 기록을 남긴다.** `results/YYYY-MM-DD_config-name.json` — 일주일만 지나도 자기가 어떤 실험을 했는지 흐릿해진다.

### 2-3. LLM-as-Judge의 함정

자동 평가를 LLM에 맡기는 게 편한데, 평가 LLM과 응답 LLM이 같으면 점수 인플레이션이 생긴다.

- ❌ 응답: gpt-4o / 평가: gpt-4o → gpt-4o가 자기 답을 후하게 채점하는 경향
- ✅ 응답: gpt-4o / 평가: Claude 또는 다른 시스템 프롬프트의 gpt-4o
- ✅ 수동 검증 5~10문항 병행. 자동 지표가 올라도 수동 검증이 떨어지면 "부분 성공"으로 분류

> 4편에서 다룬 사례 — 자동 지표는 올랐는데 사용자는 "거짓말이 늘었다"고 느꼈다. 자동 채점만 보면 이런 신호를 놓친다.

### 평가를 한 커맨드로 돌아가게

학습 프로젝트 수준이라면 CI까지 안 가도 되지만, 최소한 **로컬에서 한 커맨드로 전체 평가가 도는 형태** 까지는 잡아두는 게 좋았다. 이게 있어야 Phase 3 실험 사이클이 돌아간다.

```yaml
# 회사에서라면 이런 식으로 CI에 꽂을 수도 있을 듯
- name: Run RAG eval on Golden Set
  run: pipenv run python eval/harness.py --cases eval/cases.jsonl
- name: Compare with baseline
  run: python eval/compare.py --baseline main --head HEAD
```

<br>

## Phase 3 — 품질 고도화 (2~4주, 반복 루프)

Phase 2에서 평가 체계가 서고 나면 "무엇을 바꿀까" 가 의미 있는 질문이 된다.

### 고도화 우선순위 (영향도 × 비용 기준)

내가 직접 굴려본 5회 실험 결과 + 블로그·페이퍼에서 본 패턴을 종합한 우선순위. 도메인에 따라 순서는 바뀔 수 있다.

| 순위 | 개선 항목 | 영향도 | 구현 비용 |
|---|---|---|---|
| 1 | 청킹 전략 (헤딩 인식 / 문장 경계) | 큼 | 낮음 |
| 2 | 프롬프트 설계 (출처 인용 / 환각 거부) | 큼 | 매우 낮음 |
| 3 | Hybrid Search (BM25 + 시맨틱) | 큼 | 중간 |
| 4 | Query Rewriting (사용자 질문 정제) | 중 | 중간 |
| 5 | Cross-encoder Rerank | 중 | 중간 |
| 6 | 표·차트·수식 파싱 강화 | 경우에 따라 큼 | 높음 |

순서를 의식한 이유는 단순하다. 1~2번(청킹·프롬프트)은 하루면 큰 효과를 보는 경우가 많았고, 6번(비전 모델 합성)은 일주일을 태우고도 결과가 미묘했다. 특히 차트 환각은 [4편 첫 에피소드](/posts/rag-eval-five-paradoxes)에서 다뤘듯 모델 한계 자체였다.

### 4편에서 본 교훈 — "정직한 응답" 설계

비싼 Vision 파이프라인을 붙이는 것보다 **프롬프트에 출처 정직성 규칙을 박는 게** 효과가 큰 경우가 많았다.

> "없으면 없다"가 아니라, "시스템 한계로 읽지 못했을 수 있다"와 "본문에 따르면 …"을 LLM에 명시적으로 구분시키는 것.

자세한 설계 과정과 프롬프트 예시는 [4편 에피소드 1](/posts/rag-eval-five-paradoxes)에 정리해 뒀다.

### 실험 기록 — 정형 포맷으로

학습 사이클에서 가장 효과 본 습관 중 하나. 모든 실험을 같은 포맷으로 기록.

```markdown
## 실험 #14 — 청킹 크기 512 → 헤딩 인식 chunking

- 가설: 헤딩 단위로 청킹하면 Section 단위 질문의 recall이 올라갈 것
- 변경: RecursiveCharacterTextSplitter → Markdown heading splitter
- 결과:
  - Golden set 정확도: 68% → 74% (+6%p)
  - 환각 거부 성공률: 72% → 75% (+3%p)
  - 평균 응답 시간: 1.8s → 1.9s
- 수동 검증 (5문항): 4/5 개선, 1건 역효과 (표 중간에서 잘리는 케이스)
- 결론: 채택. 표 중간 분할은 별도 Task로 분리.
```

8주 동안 이 포맷을 반복하니까, 한참 뒤에도 어떤 실험을 왜 했고 결과가 어땠는지 다시 읽혔다. 기억보다 한 줄 노트가 훨씬 신뢰할 만했다.

<br>

## Phase 4 — 프로덕션 하드닝 (1~2주)

"로컬에서는 되는데" 를 "배포해도 되는" 으로 끌어올리는 단계. 학습 환경에서 부딪힌 함정들이 그대로 적용된다.

### 4-1. 동시성 설계 (블로그 5편 소환)

대용량 작업(PDF 파싱 / 임베딩 루프)을 `async def`에 넣으면 이벤트 루프가 멈춘다. 반대로 채팅 스트리밍은 `async def`가 맞다. 엔드포인트 성격별로 실행 모델이 달라진다는 게 가장 헷갈렸던 지점. 자세한 건 [5편](/posts/local-worked-four-traps).

```
[업로드 / 장시간 작업]  → def (FastAPI가 자동으로 스레드풀에 위임)
[채팅 / 스트리밍]        → async def + 진짜 async SDK (httpx, AsyncOpenAI)
[장시간 작업을 "응답 후"에 돌리고 싶다면]
                        → BackgroundTasks (별개 선택지)
```

### 4-2. 비용 모니터링

학습 환경에선 잘 안 보이지만, 배포 후 한 달 청구서를 보면 가장 먼저 신경 쓰게 되는 영역.

- 토큰 사용량 로깅 (embedding / chat / eval 분리)
- Vision 호출 건수 집계
- 일일 예산 알람 (OpenAI 콘솔 또는 AWS Budget)

학습 중 확인한 기준값 (2026년 기준):

- GPT-4o-mini 100회 Q&A ≒ $0.5 ~ 1 (실험 단계)
- GPT-4o 100회 Q&A ≒ $5 ~ 10 (최종 비교)
- GPT-4o Vision 1프레임 ≒ $0.01 ~ 0.03

### 4-3. 관측성 (Observability)

회사에서 FE 운영하던 감각이 그대로 적용되는 영역.

- `print()` 대신 구조화된 `logging` 사용
- 요청 ID (trace_id) 를 파이프라인 전 단계로 전파
- 실패 지점 명확화: `parsing_failed`, `embedding_failed`, `retrieval_empty`, `llm_failed`
- 품질 회귀 탐지용 샘플 질의 주기적 자동 실행 (canary)

### 4-4. 배포 옵션 (학습 중 써본 범위)

| 옵션 | 장점 | 단점 | 적합 시나리오 |
|---|---|---|---|
| Hugging Face Spaces | 무료, 간단 | 메모리 제한, JVM 무거움 | 데모·포트폴리오 |
| Railway / Render | 쉽고 빠름 | 스케일 제약 | 초기 프로덕트 |
| AWS ECS / Cloud Run | 유연 | 설정 복잡 | 본격 서비스 (학습 외) |
| 온프레미스 (Ollama + Supabase self-hosted) | 데이터 주권 | 운영 부담 | 금융·의료 (학습 외) |

학습 중 직접 굴려본 건 HF Spaces와 Railway. AWS·온프레미스는 일반적으로 그렇다고 하는 정도지 직접 운영해본 영역은 아니다.

**Docker 이미지 주의점** (학습 중 직접 겪음):

- JDK 17 없는 경우 → JDK 21로 변경
- pipenv `--system` 의존성 누락 → `requirements.txt` 기반 설치로 전환
- JVM 힙 제한: `JAVA_TOOL_OPTIONS="-Xmx1g"`
- 버전 미고정 시 빌드가 한참 걸림 → 주요 패키지 버전 고정

### 4-5. 배포 후 챙기면 좋은 것들

- 프로덕션 데이터로 Golden Set 재검증 (학습 데이터 편향 해소)
- 실제 사용자 질문 로그로 Golden Set 확장 (시간이 갈수록 가장 값나가는 자산)
- 프롬프트·모델 업데이트 전 섀도우 배포로 평가 먼저

<br>

## 한 장 체크리스트

```
[Phase 0 — 문제 정의]
□ 사용자·문서·질문 유형 정리
□ "틀렸을 때의 비용" 축 결정
□ 비즈니스 KPI ↔ 프록시 지표 매핑 문서

[Phase 1 — MVP]
□ 로컬(Ollama) 우선, 검증 후 API 전환
□ Provider 추상화 (embed/llm/eval 역할별 분리)
□ 임베딩 차원 ↔ DB 스키마 일치
□ .env.example, Pipfile.lock 커밋

[Phase 2 — 평가 체계]
□ Golden Set 30~100건 (refuse 카테고리 포함)
□ Eval harness — 한 커맨드로 실행
□ 실험은 변수 1개 × 반복 3회
□ 수동 검증 5~10문항 병행
□ 평가 LLM과 응답 LLM 분리

[Phase 3 — 품질 고도화]
□ 우선순위 1~2 (청킹·프롬프트) 먼저
□ 실험 기록을 정형 포맷으로
□ Vision·Rerank는 평가 체계가 잡힌 뒤에 손대기

[Phase 4 — 프로덕션 하드닝]
□ 업로드는 def, 채팅은 async def
□ 토큰·Vision 호출 비용 로깅 + 일일 알람
□ 구조화 logging + trace_id
□ Golden Set 프로덕션 데이터로 재검증
□ 섀도우 배포로 회귀 탐지
```

<br>

## 다시 처음으로 돌아간다면 — 한 줄씩

1. **Phase 2(평가)를 가장 먼저 잡아둔다.** 8주 중 가장 후회를 줄여준 단계.
2. **Phase 0(문제 정의)을 짧게라도 거친다.** "틀렸을 때의 비용"을 먼저 정해야 Phase 3에서 어디까지 손볼지 결정된다.
3. **Provider 추상화·실험 기록 포맷·Golden Set 버전 관리** — 이 셋만 처음에 심어둬도 한참 뒤에 다시 코드를 봐도 헤매지 않게 된다.

<br>

## 마지막으로

8주 동안 RAG·멀티모달 사이클을 한 번씩 돌리고 나서 가장 자주 했던 생각은, **"엔지니어링 감각은 의외로 잘 옮겨간다"** 는 것이었다.

프론트엔드 6년차로 시작해서 AI 모델을 직접 학습시켜 본 적도 없고, 파이썬 백엔드도 서툰 채로 들어갔다. 그런데 8주 동안 자주 꺼내 쓴 건 **수만 명이 쓰는 그룹웨어를 만들면서 쌓은 감각** 이었다. "이 에러 메시지를 사용자가 보면 뭐라고 느낄까", "이 응답 속도면 얼마나 기다려줄까", "이 장애를 어떻게 모니터링하지", "이 숫자는 뭘 의미하지" — 이런 질문들이 RAG 응답 품질·관측성·평가 설계에 그대로 꽂혔다.

이 글이 누군가에게 한 장의 지도쯤 되면 좋겠다. 직접 부딪혀 본 범위 안에서 정리한 거라 빈 곳도 많고, 더 잘 푸는 패턴도 분명히 있을 거다. 본인 경험을 덧붙여 가며 채워주시길.

끝까지 읽어주셔서 감사합니다.

<br>

---

## 🔗 연재 전체 링크

- **1편** — [Cursor랑 Claude로 매일 일하는데, 왜 되는지는 모르고 있었다](/posts/cursor-claude-why-it-works)
- **2편** — [PDF RAG를 처음부터 만들어보면서 마주친 것들](/posts/rag-build-and-troubleshoot)
- **3편** — [영상에서 자연어 검색되는 시스템을 만들어보면서 마주친 것들](/posts/multimodal-build-and-troubleshoot)
- **4편** — [지표는 올랐는데 체감은 나빠졌다 — RAG 평가의 역설](/posts/rag-eval-five-paradoxes)
- **5편** — [로컬에서는 됐는데요 — 배포 직전 한 달간 마주친 4가지 함정](/posts/local-worked-four-traps)
- **6편 (이 글)** — [회사에서 "RAG 붙여주세요" 했을 때 — 내가 정리해본 4-Phase 구축 순서](/posts/rag-playbook-four-phases)

<br>

---

*[PI Lab](https://paaa.ai) 수료 과정에서 정리한 글입니다.*
