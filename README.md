# Oh! SS Frontend

> Oh! SS의 Repository 분석 결과 탐색 및 시각화를 담당하는 React Frontend

Oh! SS Frontend는 사용자가 GitHub Repository 분석을 요청하고, Backend Analysis Engine이 생성한 **Repository 구조, Class Map, Public API, Rule & Evidence, 라이선스 분석, GitHub 통계 및 AI 분석 결과**를 웹에서 탐색할 수 있도록 제공하는 애플리케이션입니다.

프로젝트 전체 소개와 Architecture는 아래 Organization README를 참고해주세요.

https://github.com/Oh-SS-Capston

---

## 주요 기능

### 1. Repository 분석

* GitHub Repository URL 또는 `owner/repository` 형식 입력
* Repository 분석 요청
* 분석 단계별 진행 상태 확인
* 최근 분석 실행 내역 조회
* 기존 Repository 재분석

---

### 2. 코드 구조 탐색

분석된 Repository의 구조를 계층적으로 탐색할 수 있습니다.

* Repository 기본 정보
* Directory Structure
* Package
* Class
* Method
* 코드 요소 간 관계

---

### 3. Class Diagram / Class Map

Backend에서 생성된 코드 관계 정보를 기반으로 Repository의 구조를 시각화합니다.

* Class Diagram
* Class Map
* 클래스 간 관계 탐색
* Subsystem 단위 구조 확인

---

### 4. Public API

Repository에서 분석된 Public API 정보를 조회합니다.

* Public API 목록
* 관련 Class / Method
* API 관련 코드 정보
* 분석 결과와 연결된 Evidence

---

### 5. Rule & Evidence

Repository에서 분석된 개발 규칙과 관련 근거를 확인할 수 있습니다.

* Rule 분석 결과
* 관련 Source / Document Evidence
* 분석 근거 탐색

---

### 6. AI 분석 결과

AI 설명은 Backend Analysis Engine에서 생성됩니다.

Backend는 JavaParser·ASM 기반 정적 분석과 Graph 분석으로 구조화된 결과와 Evidence를 생성한 뒤, 기본적으로 **Ollama 기반 Qwen3.5 9B**를 통해 개발자가 이해하기 쉬운 설명을 생성합니다.

```text
Repository
    ↓
Static Analysis
    ↓
Structured Result / Evidence
    ↓
Ollama + Qwen3.5 9B
    ↓
AI Analysis Result
    ↓
Frontend
```

Frontend는 해당 결과를 API로 조회하여 사용자에게 제공합니다.

---

### 7. 라이선스 분석

Repository의 오픈소스 라이선스 분석 결과를 제공합니다.

* 탐지된 라이선스
* License Metric
* 라이선스 상세 정보
* Evidence 조회
* Evidence 검색 및 출처 필터
* Review Checklist
* Markdown / JSON Report

> Oh! SS의 라이선스 분석 결과는 법률 자문을 대체하지 않으며, 개발자의 오픈소스 라이선스 검토를 지원하기 위한 정보입니다.

---

### 8. GitHub Repository 통계

GitHub Repository의 활동 정보를 시각화합니다.

* Star 변화
* Issue 활동
* Release 정보
* Repository 주요 지표

---

### 9. 사용자 기능

* Google OAuth 로그인
* 사용자 정보 관리
* Token 잔액 및 사용 내역 조회
* 분석 실행 관련 Token 처리
* Token 충전 및 결제

---

## Tech Stack

| 영역                  | 기술                  |
| ------------------- | ------------------- |
| Framework           | React 19            |
| Routing             | React Router DOM 7  |
| Build               | Vite 7              |
| Styling             | Tailwind CSS 4      |
| Graph Visualization | React Flow          |
| Graph Layout        | Dagre               |
| Icons               | Lucide React        |
| Payment             | PortOne Browser SDK |

---

## Project Structure

```text
src/
├── app/
│   ├── config/          # Application 및 환경 설정
│   ├── layout/          # 공통 Layout
│   ├── providers/       # Global Provider
│   └── routes/          # Routing
│
├── features/
│   ├── auth/            # 인증
│   ├── githubStats/     # GitHub 통계
│   ├── license/         # 라이선스 분석
│   ├── membership/      # Membership
│   ├── payment/         # 결제
│   ├── run/             # Repository 분석 실행
│   └── token/           # Token 관련 기능
│
├── pages/
│   ├── Analy/           # Repository 분석 결과
│   ├── Auth/            # 인증
│   ├── GithubStats/     # GitHub 통계
│   ├── Landing/         # Repository 입력
│   ├── License/         # 라이선스 분석
│   └── MyPage/          # 사용자 정보
│
└── shared/
    ├── api/             # 공통 HTTP Client
    ├── components/      # 공통 Component
    └── styles/          # Global Style
```

---

## Local Development

### Requirements

* Node.js
* npm

### Clone

```bash
git clone https://github.com/Oh-SS-Capston/FE.git
cd FE
```

### Install

```bash
npm install
```

또는 lockfile 기준 재현 설치:

```bash
npm ci
```

### Environment

기본 Backend API 주소는 다음과 같습니다.

```text
http://localhost:8080
```

필요한 경우 환경 변수로 Backend 주소를 변경할 수 있습니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

실제 Secret 또는 운영 환경 값은 Repository에 Commit하지 않습니다.

---

## Run

```bash
npm run dev
```

Vite 개발 서버가 실행됩니다.

---

## Production Build

```bash
npm run build
```

최종 제출 전에는 clean 환경에서 다음 명령의 성공을 확인합니다.

```bash
npm ci
npm run build
```

---

## Backend Integration

Oh! SS Frontend는 Repository 분석 자체를 수행하지 않고 Backend Analysis Engine에서 생성된 분석 결과를 제공합니다.

```text
GitHub Repository
        ↓
Backend Analysis Engine
        ↓
Static / Graph Analysis
        ↓
Structured Artifacts
        ↓
Ollama + Qwen3.5 9B
        ↓
REST API
        ↓
Oh! SS Frontend
```

Backend Repository:

https://github.com/Oh-SS-Capston/BE

---

## Screenshots

프로젝트 전체 Architecture 이미지는 Organization README에서 확인할 수 있습니다.

Frontend README에는 별도 이미지를 많이 추가하지 않고, 실제 서비스와 대표 README를 통해 전체 흐름을 확인할 수 있도록 구성했습니다.

---

## Open Source

Oh! SS Frontend는 여러 오픈소스 라이브러리를 활용하여 개발되었습니다.

주요 외부 의존성의 라이선스 정보는 다음 파일에서 확인할 수 있습니다.

```text
THIRD_PARTY_LICENSES.md
```

---

## License

Oh! SS Frontend is licensed under the **Apache License 2.0**.

See [`LICENSE`](./LICENSE) for details.

Third-party dependencies remain subject to their respective licenses.

See [`THIRD_PARTY_LICENSES.md`](./THIRD_PARTY_LICENSES.md).
