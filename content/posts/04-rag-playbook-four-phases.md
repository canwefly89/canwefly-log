---
title: "회사에서 \"RAG 붙여주세요\" 했을 때 — 내가 쓰는 4-Phase 구축 플레이북"
description: "문제 정의 → MVP → 평가 체계 → 고도화 → 프로덕션 하드닝. MLOps 관점까지 녹인 실무 플레이북."
date: "2026-04-19"
slug: "rag-playbook-four-phases"
tags: ["pi-lab", "rag", "mlops", "playbook", "ai"]
series:
  id: "pi-lab-intensive"
  name: "PI Lab 8주 인텐시브 연재"
  order: 4
  total: 4
---


## 내일 회사에서 "RAG 붙여주세요" 티켓이 온다면

요즘 채용 공고만 훑어봐도 **"RAG 파이프라인 설계·운영 경험"**, **"벡터 DB 활용"**, **"LLM 서비스 품질 평가"** 가 공통 키워드다. AI 팀이 따로 없는 회사에서도, 프로덕트 PM이 "우리 문서 수천 건으로 챗봇 붙여보자" 하는 상황이 실제로 벌어진다.

그래서 이 글은 **"내가 내일 그 티켓을 받는다면, 어떤 순서로 어떤 판단을 할까"** 를 4-Phase로 정리한 플레이북이다. 과정이 학습이 아니라 **실제 서비스를 만드는 관점**으로 썼다. 북마크해두고 실무에서 꺼내 쓸 수 있는 형태로.

> 🖼️ *[짤 자리: "이거 그냥 LangChain 복붙하면 되는 거 아니에요?" 밈]*

> ⚠️ **경고**: Bing/ChatGPT에서 튜토리얼 복붙해서 배포하는 순간, 6개월 뒤에 "왜 답변이 이상하냐"는 컴플레인이 날아오고 **아무도 답을 못 한다**. 이 플레이북은 그걸 피하기 위한 순서다.

<br>

## 전체 지도

```
Phase 0 ─ 문제 정의와 성공 지표 잡기        (1~3일, 제일 많이 건너뜀)
   │
   ▼
Phase 1 ─ MVP 파이프라인 (일단 작동)        (1~2주)
   │
   ▼
Phase 2 ─ 평가 체계 확립 (★ 가장 중요)      (3~5일)
   │
   ▼
Phase 3 ─ 품질 고도화                       (2~4주, 반복)
   │
   ▼
Phase 4 ─ 프로덕션 하드닝                   (1~2주)
```

**핵심 원칙**: Phase 2(평가 체계)를 먼저 짓지 않고 Phase 3(고도화)에 들어가면, 이후 모든 실험이 "느낌"으로 판단된다. 이게 MLOps 실패의 99%다.

<br>

## Phase 0 — 문제 정의와 성공 지표 (1~3일)

**가장 많이 건너뛰는 단계**다. 그런데 이걸 안 하고 Phase 1로 넘어가면, 3주 뒤에 **"근데 이거 뭐가 되면 성공인거죠?"** 라는 질문에 아무도 답을 못 한다.

### 정리해야 할 4가지

| 질문 | 예시 답변 |
|---|---|
| **사용자는 누구인가** | 사내 CS 팀 직원 30명 / 외부 고객 수천 명 |
| **어떤 문서를 다루는가** | PDF / HWP / 노션 / 슬랙 대화 로그 |
| **어떤 질문을 하는가** | 사실 조회 / 요약 / 비교 / 의사결정 지원 |
| **틀렸을 때의 비용은?** | 내부 보조 도구 (관대) / 법무·의료 (엄격) |

"틀렸을 때의 비용"이 **가장 중요한 축**이다. 이게 낮으면 LLM 호출 한 방으로도 충분하고, 이게 높으면 **리트리버 + 리랭커 + 출처 인용 + 환각 거부**까지 다 필요하다. 이 축을 먼저 정하지 않으면 Phase 3에서 오버엔지니어링이 반드시 터진다.

### 측정 가능성부터 확보하기 (MLOps의 시작점)

비즈니스 요구사항을 **측정 가능한 지표**로 내려오는 작업. 이게 안 되면 "개선됐다"는 말을 아무도 증명 못 한다.

- **비즈니스 KPI**: "CS 응대 시간 30% 감소", "고객 자가 해결률 50%"
- **프록시 지표 (엔지니어링 영역)**:
  - 정답률 (Golden set 기준)
  - 환각 거부 성공률 (모르는 질문에 "모른다"고 답하는 비율)
  - 응답 시간 p50 / p95
  - **비용**: 질의당 토큰·Vision 호출 수

KPI ↔ 프록시 지표 매핑을 문서로 남겨라. 나중에 "지표는 올랐는데 사업은 안 좋아졌다" 의 원인 분석에 반드시 필요하다.

<br>

## Phase 1 — MVP 파이프라인 (1~2주)

**목표**: "사용자가 문서를 올리면, 답을 반환한다"를 일단 돌아가게 만들기. 품질은 Phase 3에서 올린다.

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

> \* `opendataloader-pdf`는 Java 11+ 기반의 비교적 덜 알려진 오픈소스 PDF 파서다. **페이지 경계를 넘는 테이블 처리**에 강점이 있어 보고서·논문처럼 표가 쪼개지는 문서에서 효과가 크다. PyPI가 아닌 GitHub(`opendataloader-project/opendataloader-pdf`) 기반 설치라 러닝 커브가 있다. 일반적인 케이스라면 pdfplumber로 시작해도 충분하다.

### 스택 선택의 실무 기준

| 항목 | 저렴·쉬움 → 비쌈·강력 |
|---|---|
| 임베딩 | Ollama(bge-m3, 무료) → OpenAI → HuggingFace Inference |
| LLM | gpt-4o-mini / llama3.1 → gpt-4o → Claude Opus |
| 벡터DB | Supabase pgvector → Qdrant / Weaviate → Pinecone |
| PDF 파싱 | pdfplumber (간단) → Unstructured (구조 인식) → opendataloader-pdf (페이지 경계 테이블 특화, Java 필요) |

**처음부터 유료 API로 가지 마라.** Ollama 로컬로 파이프라인 전체를 한 번 태워본 뒤, **검증된 시점에서만** API로 전환. 비용은 이 원칙 하나로 10분의 1로 줄어든다.

### MLOps 관점 — Provider 추상화부터 심어라

이게 Phase 1의 숨은 핵심이다. **모델 락인을 처음부터 피하는 설계**.

```python
# config.py — 역할별로 Provider 독립 스위칭
EMBED_PROVIDER = "ollama"    # ollama | openai | huggingface
EMBED_MODEL    = "bge-m3"
EMBED_DIM      = 1024        # ⚠️ DB 스키마 vector(N) 와 반드시 일치

LLM_PROVIDER = "openai"      # openai | ollama
LLM_MODEL    = "gpt-4o-mini"

EVAL_PROVIDER = "openai"     # 평가용 LLM을 메인과 분리 가능
EVAL_MODEL    = "gpt-4o"     # 평가는 더 강한 모델로
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

이걸 나중에 하려면 **전체 코드를 다 뜯어고쳐야** 한다. 처음부터 분리해두면, 6개월 뒤 "GPT-5 나왔대요" 할 때 환경변수 한 줄 바꾸는 걸로 끝난다.

### 재현성 체크리스트

- [ ] `.env.example` 커밋 (실제 `.env`는 gitignore)
- [ ] Python 버전 고정 (`pyenv local 3.11`)
- [ ] 의존성 락 (Pipfile.lock / poetry.lock)
- [ ] DB 스키마는 **버전별 SQL 파일**로 (`01-document-chunks-bge-m3-1024.sql`)
- [ ] 임베딩 모델명·차원을 README에 명시

<br>

## Phase 2 — 평가 체계 확립 ⭐ (3~5일, 건너뛰면 망한다)

**진짜 MLOps가 시작되는 지점.**

Phase 3 고도화에 바로 뛰어들지 마라. "청킹 크기 512 → 256으로 바꿨더니 답변이 좋아진 것 같다"는 **절대 증명 불가능**하다. 평가 체계 없이 올리는 품질 개선은 **미신**이다.

### 2-1. Golden Set 구축 (반나절)

- 실제 데이터에서 **Q&A 30~100개**를 손으로 작성
- 각 항목: `질문 / 기대 답변 / 기대 출처(있다면)`
- 쉬운 사실 조회 + 표 질문 + 환각 유도 질문(문서에 없는 내용) **섞을 것**
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

**핵심 원칙 3가지**:

1. **변수 1개만 바꿔라.** 청크 크기·임베딩 모델·top-k 를 동시에 바꾸면 원인 분리 불가.
2. **반복 실행해라.** LLM은 비결정적이다. 최소 3회 돌려 분산 확인.
3. **실험 기록을 남겨라.** `results/YYYY-MM-DD_config-name.json` — 6개월 뒤 자기가 무슨 실험 했는지 기억 못 한다.

### 2-3. LLM-as-Judge의 함정

자동 평가를 LLM에 맡기는 게 편하긴 한데, **평가 LLM이 응답 LLM과 같거나 유사하면 점수 인플레이션**이 발생한다.

- ❌ 응답: gpt-4o / 평가: gpt-4o → gpt-4o가 자기 답을 후하게 채점
- ✅ 응답: gpt-4o / 평가: Claude 또는 gpt-4o + 다른 시스템 프롬프트
- ✅ **수동 검증 5~10문항을 병행**. 자동 지표가 올라도 수동 검증이 떨어지면 "부분 성공"으로 분류

> 💡 **블로그 3편에서 다룬 경험**: 자동 지표는 올랐는데 실제 사용자는 "거짓말이 늘었다"고 느꼈다. LLM-as-Judge를 맹신하면 이 신호를 놓친다.

### MLOps 관점 — 평가를 CI에 꽂을 수 있는가

Phase 2가 제대로 서면, 이후 모든 변경이 **PR에서 숫자로 증명**된다.

```yaml
# .github/workflows/eval.yml (예시)
- name: Run RAG eval on Golden Set
  run: pipenv run python eval/harness.py --cases eval/cases.jsonl
- name: Compare with baseline
  run: python eval/compare.py --baseline main --head HEAD
```

작은 프로젝트라면 CI까지 안 가도 되지만, **최소한 로컬에서 한 커맨드**로 전체 평가가 돌아가게 만들어라.

<br>

## Phase 3 — 품질 고도화 (2~4주, 반복 루프)

Phase 2에서 평가 체계가 서고 나면, 이제야 **"무엇을 바꿔야 하는가"** 질문이 의미 있어진다.

### 고도화 우선순위 (영향도 × 비용 기준)

| 순위 | 개선 항목 | 영향도 | 구현 비용 |
|---|---|---|---|
| 1 | **청킹 전략** (헤딩 인식 / 문장 경계) | 큼 | 낮음 |
| 2 | **프롬프트 설계** (출처 인용 / 환각 거부) | 큼 | 매우 낮음 |
| 3 | **Hybrid Search** (BM25 + 시맨틱) | 큼 | 중간 |
| 4 | **Query Rewriting** (사용자 질문 정제) | 중 | 중간 |
| 5 | **Cross-encoder Rerank** | 중 | 중간 |
| 6 | **표·차트·수식 파싱 강화** | 경우에 따라 큼 | 높음 |

**순서가 중요하다.** 1~2번(청킹 + 프롬프트)은 하루면 큰 효과가 나온다. 6번(비전 모델 합성)부터 가면 일주일 태우고 성과 없을 수 있다.

### 3편에서 다룬 교훈 — "정직한 응답" 설계

비싼 Vision 파이프라인을 붙이는 것보다, **프롬프트에 출처 정직성 규칙을 박는 게** 효과가 훨씬 큰 경우가 많았다. 한 줄로 정리하면:

> **"없으면 없다"가 아니라, "시스템 한계로 읽지 못했을 수 있다"와 "본문에 따르면 …"을 LLM에 명시적으로 구분시키는 것.**

자세한 설계 과정과 실제 프롬프트 예시는 [3편의 에피소드 1](/posts/rag-eval-five-paradoxes)에 정리해 뒀다. Phase 3에서는 이 원칙을 코드로 내려 **시스템 프롬프트의 한 섹션**으로 고정해두면 많은 환각을 조기에 막을 수 있다.

### 실험 관리 — upgrade-report.md 패턴

모든 개선 실험은 **정형 포맷**으로 기록하라. "기억"은 MLOps의 적이다.

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

이 포맷을 반복하면, 3개월 뒤 당신의 레포는 **실전 MLOps 사례집**이 되어 있다.

<br>

## Phase 4 — 프로덕션 하드닝 (1~2주)

"로컬에서는 되는데" 를 "배포해도 되는"으로 끌어올리는 단계.

### 4-1. 동시성 설계 (블로그 2편 소환)

대용량 작업(PDF 파싱 / 임베딩 루프)을 `async def`에 넣으면 이벤트 루프가 멈춘다. 반대로 채팅 스트리밍은 `async def`가 맞다. **엔드포인트 성격별로 실행 모델을 나눠라.** 자세한 건 2편 참고.

```
[업로드 / 장시간 작업]  → def (FastAPI가 자동으로 스레드풀에 위임)
[채팅 / 스트리밍]        → async def + 진짜 async SDK (httpx, AsyncOpenAI)
[장시간 작업을 "응답 후"에 돌리고 싶다면]
                        → BackgroundTasks (별개 선택지)
```

### 4-2. 비용 모니터링

"품질은 좋아졌는데 한 달 뒤 API 청구서가…" 는 실제로 자주 벌어진다.

- 토큰 사용량 로깅 (embedding / chat / eval 분리)
- Vision 호출 건수 집계
- **일일 예산 알람** 설정 (OpenAI 콘솔 또는 AWS Budget)

실제 기준값 (2026년 기준):
- GPT-4o-mini 100회 Q&A ≒ $0.5 ~ 1 (실험 단계)
- GPT-4o 100회 Q&A ≒ $5 ~ 10 (최종 비교)
- GPT-4o Vision 1프레임 ≒ $0.01 ~ 0.03

### 4-3. 관측성 (Observability)

- `print()` 금지. 구조화된 `logging` 사용
- 요청 ID (trace_id) 를 파이프라인 전 단계로 전파
- 실패 지점 명확화: `parsing_failed`, `embedding_failed`, `retrieval_empty`, `llm_failed`
- 품질 회귀 탐지용 **샘플 질의에 대한 주기적 자동 실행** (canary)

### 4-4. 배포 옵션 매트릭스

| 옵션 | 장점 | 단점 | 적합 시나리오 |
|---|---|---|---|
| Hugging Face Spaces | 무료, 간단 | 메모리 제한, JVM 무거움 | 데모·포트폴리오 |
| Railway / Render | 쉽고 빠름 | 스케일 제약 | 초기 프로덕트 |
| AWS ECS / Cloud Run | 유연 | 설정 복잡 | 본격 서비스 |
| 온프레미스 (Ollama + Supabase self-hosted) | 데이터 주권 | 운영 부담 | 금융·의료 |

**Docker 이미지 주의점** (실제 겪음):
- JDK 17 없는 경우 → JDK 21로 변경
- pipenv `--system` 의존성 누락 → `requirements.txt` 기반 설치로 전환
- JVM 힙 제한: `JAVA_TOOL_OPTIONS="-Xmx1g"`
- 버전 미고정 시 빌드 수 시간 → 주요 패키지 버전 고정

### 4-5. 배포 후 반드시 할 일

- 프로덕션 데이터로 **Golden Set 재검증** (로컬 데이터 편향 해소)
- 실제 사용자 질문 로그로 **Golden Set 확장** (이게 진짜 자산)
- 프롬프트·모델 업데이트 전 **섀도우 배포**로 평가 먼저

<br>

## 한 장 체크리스트 (북마크용)

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

[Phase 2 — 평가 체계] ★ 건너뛰지 말 것
□ Golden Set 30~100건 (refuse 카테고리 포함)
□ Eval harness — 한 커맨드로 실행
□ 실험은 변수 1개 × 반복 3회
□ 수동 검증 5~10문항 병행
□ 평가 LLM과 응답 LLM 분리

[Phase 3 — 품질 고도화]
□ 우선순위 1~2 (청킹·프롬프트) 먼저
□ 실험 기록을 upgrade-report 포맷으로
□ Vision·Rerank 는 Phase 2 없이 넘어가지 말 것

[Phase 4 — 프로덕션 하드닝]
□ 업로드는 def + BackgroundTasks, 채팅은 async def
□ 토큰·Vision 호출 비용 로깅 + 일일 알람
□ 구조화 logging + trace_id
□ Golden Set 프로덕션 데이터로 재검증
□ 섀도우 배포로 회귀 탐지
```

<br>

## 왜 이 순서인가 — 핵심 메시지 3줄

1. **Phase 2(평가)를 먼저 짓지 않으면 Phase 3(고도화) 는 전부 미신이다.**
2. **오버엔지니어링은 Phase 0(문제 정의) 의 누락에서 시작한다.** "틀렸을 때의 비용"을 먼저 정해야 Vision·Rerank·Hybrid를 **어디까지** 쓸지 결정된다.
3. **MLOps는 도구가 아니라 습관이다.** Provider 추상화 / 실험 기록 포맷 / Golden Set 버전 관리 — 이 세 가지만 초기에 심어도 6개월 뒤 코드베이스가 완전히 달라진다.

<br>

## 이 플레이북이 나온 배경

이 문서는 [PI Lab (파이랩)](https://paaa.ai) **8주 인텐시브**를 거치면서 정리한, 실무 투입 순서다.

- **Sprint 2 (RAG)**: 빈 껍데기 서버를 Phase 1~2 수준까지 끌어올리는 경험
- **Sprint 3 (멀티모달)**: 비동기 처리와 Job 상태 관리 — Phase 4 의 동시성 설계 원형
- **Sprint 4 (고도화)**: Phase 2~3 의 평가 시스템 구축 + 실험 관리 + 환각 방지
- 공통적으로 **"변수 1개 격리 / 반복 3회 / 수동 검증 5문항"** 원칙을 몸으로 익혔다

혼자 튜토리얼을 따라갔다면, 아마 Phase 1에서 멈추고 Phase 2를 건너뛰었을 거다. "평가 체계를 먼저 세워야 한다"는 건 **책보다 실전에서, 페어와의 리뷰에서 배우는** 감각이다.

<br>

## 마지막으로

이 4편짜리 연재를 쓰면서 가장 많이 든 생각은 — **엔지니어링 감각은 의외로 이동 가능하다**는 것이었다.

나는 프론트엔드 6년차로 8주를 시작했다. AI 모델을 직접 학습시켜 본 적도 없고, 파이썬 백엔드에도 서툴렀다. 그런데 8주 동안 RAG 파이프라인을 올리고, 평가 체계를 짓고, 배포하고, 실패한 실험을 기록하는 과정에서 가장 자주 꺼내 쓴 건 **수만 명이 쓰는 그룹웨어를 만들면서 쌓은 감각**이었다. "이 에러 메시지를 사용자가 보면 뭐라고 느낄까", "이 응답 속도면 사용자가 얼마나 기다려줄까", "이 장애는 어떻게 모니터링하지", "이 숫자는 뭘 의미하지" — 이런 질문들이 AI 시스템의 관측성·평가 설계에 그대로 꽂혔다.

그리고 이걸 통해 깨달은 게 하나 있다. 내가 8주 동안 올라선 자리 — **문제를 측정 가능한 지표로 번역하고, 평가 체계로 품질을 수치화하고, 한계를 정직하게 공유하고, 비용·시간·정확도 사이에서 의사결정하는 자리** — 는 "AI를 잘 호출하는 사람"의 자리와는 꽤 다른 곳이었다. 그리고 이 자리는 FE 6년차에게도, 백엔드 N년차에게도, 학부생에게도 **동일하게** 열려 있다. 기존 경력은 버려야 할 것이 아니라 발판이 된다.

이 플레이북이 누군가에게 지도 한 장이 되면 좋겠다. 북마크하고, 필요할 때 꺼내 쓰고, 본인 경험을 덧붙여 가며 더 좋은 버전으로 업데이트해주시길.

끝까지 읽어주셔서 감사합니다. 🙏

<br>

---

## 🔗 연재 전체 링크

- **1편** — [프론트엔드 6년차, AI가 내 일을 먼저 할까 봐 AI를 만드는 법을 배우기로 했다](/posts/cursor-claude-why-it-works)
- **2편** — [`async def`를 썼는데 왜 서버가 통째로 멈췄을까 — FastAPI의 반직관적 함정](/posts/local-worked-four-traps)
- **3편** — [Vision 해상도를 올렸더니 환각이 늘었다 — RAG에서 그래프를 정직하게 다루는 법](/posts/rag-eval-five-paradoxes)
- **4편 (이 글)** — [회사에서 "RAG 붙여주세요" 했을 때 — 내가 쓰는 4-Phase 구축 플레이북](/posts/rag-playbook-four-phases)

<br>

---

## 📌 이 글은 PI Lab 인턴 연구원 수료 과정의 일부로 작성되었습니다

- **PI Lab (파이랩)** — AI 엔지니어링 8주 인텐시브
- 홈페이지: [https://paaa.ai](https://paaa.ai)
- 커리큘럼: 4개 스프린트 (ML 기초 / RAG / 멀티모달 / 실서비스 고도화)
- 대상: "단순 구현을 넘어, AI 시스템을 설계하려는 엔지니어"
- 슬로건: *Progress, not Perfection*
