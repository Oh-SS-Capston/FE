<div align="center">

# Oh! SS

### GitHub 오픈소스 저장소 분석 및 시각화 플랫폼

GitHub 저장소를 입력하면 소스 코드를 분석하여
**디렉터리 구조, 클래스 다이어그램, API 문서, 시나리오 명세, 서브시스템 요약 및 GitHub 통계**를 시각적으로 제공합니다.

<br />

</div>

---

## 프로젝트 소개

**Oh! SS**는 오픈소스 프로젝트의 복잡한 구조를 보다 쉽게 이해할 수 있도록 지원하는 웹 서비스입니다.

사용자가 GitHub 저장소 URL을 입력하면 백엔드 분석 파이프라인을 실행하고, 생성된 분석 산출물을 프런트엔드에서 단계별로 조회할 수 있습니다.

단순한 저장소 정보 조회를 넘어 다음과 같은 정보를 제공합니다.

* 저장소 기본 정보 및 디렉터리 구조
* 분석 작업 진행 상태
* 클래스 관계 다이어그램
* 패키지별 클래스 및 메서드 문서
* 시나리오 명세
* 서브시스템 요약
* API 문서
* 파일 트리 설명
* 정제된 분석 규칙
* GitHub 저장소 활동 통계

---

## 주요 기능

### 1. Google 계정 인증

* Google OAuth 기반 로그인 및 회원가입
* 인증 사용자 전용 저장소 분석
* 로그인 상태 자동 확인
* 인증 만료 시 토큰 재발급 요청
* 로그아웃 및 회원 탈퇴
* 사용자 닉네임 관리

### 2. GitHub 저장소 분석 요청

다음 두 가지 형식으로 저장소를 입력할 수 있습니다.

```text
https://github.com/owner/repository
```

```text
owner/repository
```

입력된 저장소는 백엔드 분석 작업으로 등록되며, 생성된 `runId`를 기준으로 분석 상태와 산출물을 조회합니다.

### 3. 분석 진행 상태 확인

분석 요청 이후 작업 상태를 주기적으로 조회합니다.

```text
QUEUED → RUNNING → SUCCESS
```

분석 과정에서 특정 산출물이 먼저 생성되면 전체 작업이 완료되기 전에도 해당 결과를 우선적으로 표시합니다.

실패한 분석 단계가 있을 경우 단계별 오류 메시지를 확인할 수 있습니다.

### 4. 저장소 기본 정보 조회

GitHub API를 통해 다음 정보를 제공합니다.

* 저장소 이름
* 설명
* 주요 언어
* Star 수
* Fork 수
* 라이선스
* 최종 업데이트 일자
* 저장소 디렉터리 구조

### 5. 클래스 다이어그램 시각화

정적 분석 결과로 생성된 클래스 관계 데이터를 시각화합니다.

* 클래스 간 연결 관계
* 패키지 및 클래스 구조
* 상속·참조 관계 탐색
* 확대, 축소 및 화면 이동

다이어그램 렌더링에는 `@xyflow/react`와 `@dagrejs/dagre`를 사용합니다.

### 6. 패키지별 클래스 문서

분석된 저장소의 패키지 단위 정보를 제공합니다.

* 패키지 목록
* 클래스 목록
* 클래스별 메서드
* 메서드 설명
* 소스 코드 구조 탐색

### 7. LLM 기반 분석 결과

분석 파이프라인에서 생성된 LLM 산출물을 항목별로 제공합니다.

| 산출물                 | 설명                    |
| ------------------- | --------------------- |
| Scenario Specs      | 주요 기능 흐름과 사용 시나리오     |
| Subsystem Summaries | 시스템을 구성하는 하위 모듈 요약    |
| API Docs            | 분석된 API와 메서드 문서       |
| File Tree Docs      | 파일 및 디렉터리 역할 설명       |
| Refined Rules       | 정적 분석 결과를 기반으로 정제된 규칙 |

필요한 경우 동일 저장소에 대해 분석 결과를 강제로 재생성할 수 있습니다.

### 8. GitHub 통계 대시보드

분석한 저장소의 GitHub 활동 정보를 대시보드 형태로 제공합니다.

* Star 및 Fork 현황
* 저장소 주요 언어
* Contributor 정보
* Branch 및 Release 정보
* 최근 이슈 생성·해결 현황
* 저장소 활동 요약
* 저장소 상태에 대한 인사이트

> GitHub API가 과거 Star 누적 시계열을 직접 제공하지 않는 경우, 현재 Star 수를 기준으로 화면용 추이를 표시합니다.

### 9. 최근 분석 기록

로그인 사용자가 이전에 요청한 분석 기록을 조회할 수 있습니다.

분석 기록은 브라우저의 `localStorage`가 아닌 백엔드의 사용자별 분석 데이터로 관리됩니다.

---

## 주요 화면

### Landing Page

* GitHub 저장소 URL 입력
* 추천 오픈소스 저장소 제공
* 최근 분석 기록 조회
* 로그인 여부에 따른 분석 기능 제어

### Analyze Page

* 저장소 기본 정보
* 디렉터리 구조
* 분석 진행 상태
* 클래스 다이어그램
* 패키지·클래스·메서드 문서
* LLM 분석 결과
* 분석 결과 재생성

### GitHub Stats Page

* 저장소 주요 지표
* 활동 데이터 차트
* Contributor 및 커뮤니티 정보
* 저장소 관리 현황
* 분석 인사이트

### My Page

* 사용자 정보 확인
* 닉네임 관리
* 멤버십 정보 확인
* 계정 관리

---

## 기술 스택

### Frontend

| 분류           | 기술                  |
| ------------ | ------------------- |
| UI Library   | React 19            |
| Build Tool   | Vite                |
| Routing      | React Router DOM    |
| Styling      | Tailwind CSS        |
| Icon         | Lucide React        |
| Diagram      | React Flow          |
| Graph Layout | Dagre               |
| Payment      | PortOne Browser SDK |
| Deployment   | Vercel              |

### 주요 패키지

```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.13.1",
  "@xyflow/react": "^12.10.2",
  "@dagrejs/dagre": "^3.0.0",
  "lucide-react": "^0.576.0",
  "@portone/browser-sdk": "^0.1.8",
  "tailwindcss": "^4.2.1"
}
```

---

## 서비스 동작 흐름

```text
1. Google 로그인
        ↓
2. GitHub 저장소 URL 입력
        ↓
3. 분석 작업 생성
   POST /api/v1/runs
        ↓
4. runId 발급
        ↓
5. 분석 진행 상태 Polling
   GET /api/v1/runs/{runId}/progress
        ↓
6. 분석 산출물 ID 확인
        ↓
7. 산출물 데이터 조회
   GET /api/v1/artifacts/{artifactId}
        ↓
8. 클래스 다이어그램 및 LLM 결과 시각화
        ↓
9. GitHub 통계 조회
   GET /api/v1/runs/{runId}/github-stats
```

---

## 프로젝트 구조

```text
src/
├── app/
│   ├── config/
│   │   └── env.js
│   ├── layout/
│   │   └── AppShell.jsx
│   ├── providers/
│   └── routes/
│       └── index.jsx
│
├── assets/
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   └── model/
│   ├── githubStats/
│   │   └── api/
│   ├── membership/
│   │   └── api/
│   └── run/
│       └── api/
│
├── pages/
│   ├── Analy/
│   │   ├── components/
│   │   └── AnalyPage.jsx
│   ├── Auth/
│   ├── GithubStats/
│   │   └── GithubStatsPage.jsx
│   ├── Landing/
│   │   ├── components/
│   │   └── LandingPage.jsx
│   └── MyPage/
│       └── MyPage.jsx
│
├── shared/
│   ├── api/
│   │   └── client.js
│   └── components/
│
└── main.jsx
```

### 디렉터리 역할

| 디렉터리       | 역할                                 |
| ---------- | ---------------------------------- |
| `app`      | 애플리케이션 설정, 라우팅, 레이아웃 및 Provider 구성 |
| `features` | 인증, 분석 작업, 멤버십, GitHub 통계 등 도메인 기능 |
| `pages`    | 라우트별 페이지 컴포넌트                      |
| `shared`   | 공통 API Client와 재사용 컴포넌트            |
| `assets`   | 이미지 및 정적 리소스                       |

---

## 라우팅

| 경로               | 설명              | 인증 필요 |
| ---------------- | --------------- | ----- |
| `/`              | 메인 및 저장소 검색 화면  | 아니요   |
| `/analyze`       | 저장소 분석 결과 화면    | 예     |
| `/github-stats`  | GitHub 통계 대시보드  | 예     |
| `/mypage`        | 사용자 정보 및 계정 관리  | 예     |
| `/login/success` | OAuth 로그인 성공 처리 | 아니요   |
| `/login/failure` | OAuth 로그인 실패 처리 | 아니요   |

분석 페이지는 다음 쿼리 파라미터를 사용합니다.

```text
/analyze?runId={RUN_ID}&repo={OWNER/REPOSITORY}
```

GitHub 통계 페이지도 분석 작업의 `runId`를 기준으로 데이터를 조회합니다.

```text
/github-stats?runId={RUN_ID}&repo={OWNER/REPOSITORY}
```

---

## 로컬 실행 방법

### 1. 저장소 복제

```bash
git clone https://github.com/Oh-SS-Capston/FE.git
cd FE
```

현재 개발 버전을 실행하려면 `develop` 브랜치로 이동합니다.

```bash
git switch develop
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

환경변수를 지정하지 않으면 기본값으로 다음 주소를 사용합니다.

```text
http://localhost:8080
```

> API 주소 마지막의 `/`는 애플리케이션 내부에서 자동으로 제거됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

실행 후 터미널에 표시되는 Vite 개발 서버 주소로 접속합니다.

일반적인 기본 주소는 다음과 같습니다.

```text
http://localhost:5173
```

---

## 실행 명령어

| 명령어               | 설명              |
| ----------------- | --------------- |
| `npm run dev`     | Vite 개발 서버 실행   |
| `npm run build`   | 운영 배포용 빌드 생성    |
| `npm run preview` | 생성된 빌드 결과 로컬 확인 |

### 운영 빌드

```bash
npm run build
```

빌드 결과는 `dist` 디렉터리에 생성됩니다.

### 빌드 결과 확인

```bash
npm run preview
```

---

## API 연동

모든 백엔드 요청은 공통 API Client를 통해 처리합니다.

```text
src/shared/api/client.js
```

API Client의 주요 동작은 다음과 같습니다.

* `VITE_API_BASE_URL` 기반 API 요청
* JSON 요청 및 응답 처리
* 쿠키 기반 인증 요청
* HTTP 401 응답 시 Access Token 재발급 요청
* 토큰 재발급 성공 후 기존 요청 재시도
* 공통 API 오류 객체 변환

인증 쿠키를 전달하기 위해 모든 요청에 다음 옵션을 사용합니다.

```javascript
credentials: "include"
```

따라서 백엔드에서는 프런트엔드 도메인에 대한 CORS 및 Credential 설정이 필요합니다.

---

## 주요 API

### 분석 작업

```http
POST /api/v1/runs
```

```json
{
  "repoUrl": "https://github.com/owner/repository",
  "ref": null,
  "forceRebuild": false
}
```

### 최근 분석 기록

```http
GET /api/v1/runs/recent
```

### 분석 진행 상태

```http
GET /api/v1/runs/{runId}/progress
```

### 분석 산출물

```http
GET /api/v1/artifacts/{artifactId}
```

### GitHub 통계

```http
GET /api/v1/runs/{runId}/github-stats
```

강제로 최신 통계를 조회할 경우 다음 쿼리 파라미터를 사용합니다.

```http
GET /api/v1/runs/{runId}/github-stats?forceRefresh=true
```

### 인증 갱신

```http
POST /api/v1/auth/refresh
```

---

## 배포

프런트엔드는 Vercel 배포 환경을 지원합니다.

React Router를 사용하는 SPA에서 새로고침 시 404가 발생하지 않도록 모든 요청을 `index.html`로 전달합니다.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Vercel 프로젝트에는 다음 환경변수를 등록해야 합니다.

```env
VITE_API_BASE_URL=https://your-api-server.com
```

배포 주소:

```text
https://fe-coral-nine.vercel.app/
```

---

## 유의사항

### 백엔드 서버 필요

저장소 분석, 로그인, 최근 분석 기록, LLM 산출물 및 GitHub 통계 기능은 백엔드 API에 의존합니다.

프런트엔드만 실행하면 화면은 표시될 수 있지만 실제 분석 기능은 정상적으로 동작하지 않습니다.

### CORS 설정

프런트엔드와 백엔드의 Origin이 다를 경우 백엔드에서 다음 설정이 필요합니다.

* 프런트엔드 Origin 허용
* Credential 요청 허용
* OAuth Redirect URI 등록
* 쿠키의 `SameSite` 및 `Secure` 속성 확인

### GitHub API 제한

일부 저장소 정보와 디렉터리 구조는 GitHub REST API를 통해 조회합니다.

GitHub API 요청 한도를 초과하면 저장소 정보 또는 디렉터리 조회가 제한될 수 있습니다.

### 인증이 필요한 페이지

다음 페이지는 로그인하지 않은 상태에서 접근할 수 없습니다.

* 저장소 분석 페이지
* GitHub 통계 페이지
* 마이페이지

---

## 브랜치 전략

```text
main
└── 운영 및 배포 기준 브랜치

develop
└── 기능 통합 및 개발 기준 브랜치

feature/*
└── 기능 단위 개발 브랜치

fix/*
└── 버그 수정 브랜치
```

브랜치 전략은 팀 운영 방식에 따라 변경될 수 있습니다.

---

## Commit Convention

| Prefix     | 설명             |
| ---------- | -------------- |
| `feat`     | 새로운 기능 추가      |
| `fix`      | 버그 수정          |
| `design`   | UI 및 스타일 변경    |
| `refactor` | 코드 구조 개선       |
| `docs`     | 문서 수정          |
| `test`     | 테스트 코드 추가 및 수정 |
| `chore`    | 설정 및 빌드 관련 변경  |

---

<div align="center">

### Explore the Galaxy of OSS

복잡한 오픈소스 프로젝트를 분석하고
구조와 관계를 하나의 화면에서 탐색합니다.

</div>
