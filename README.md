# Oh! SS (Capstone)

GitHub 레포지토리를 입력하면 정적 분석 기반 산출물(그래프/심볼/엣지/근거)을 생성하고,
UI에서 Public API, 다이어그램, 시나리오 등을 탐색할 수 있는 프로젝트입니다.

---

## 주요 특징

- **저장소 분석 실행**
  - GitHub 저장소 URL 또는 `owner/repo` 형식 입력
  - 최근 분석 실행 내역 조회와 재실행
  - 분석 단계별 진행 상태와 완료 알림 제공
- **코드 구조 탐색**
  - 저장소 기본 정보와 디렉토리 트리 조회
  - 패키지, 클래스, 메서드 단위 문서 탐색
  - 클래스 관계 다이어그램과 서브시스템별 클래스 맵 제공
- **AI 분석 결과**
  - 파일 구조, 시나리오, 서브시스템, Public API 분석
  - 정제 규칙과 코드 근거를 포함한 상세 결과 제공
- **라이선스 분석**
  - 라이선스 식별 결과와 핵심 지표 제공
  - 분석 근거 검색, 출처 필터, 검토 체크리스트 지원
  - Markdown 및 JSON 형식의 분석 보고서 다운로드
- **GitHub 통계**
  - 스타 추이, 이슈 활동, 릴리스와 저장소 핵심 지표 시각화
  - 저장소 활동 데이터를 기반으로 한 인사이트 제공
- **회원 및 결제**
  - Google 계정 기반 로그인과 회원 정보 관리
  - 토큰 잔액, 사용 내역, 충전 및 결제 검증 지원

---

## 기능 검증 문서

- [라이선스 분석 기능 검증 가이드](docs/license-analysis-verification.md)

---

## 스택

### Frontend
- React + Vite
- react-router-dom
- lucide-react (icons)
- Tailwind CSS (전역 스타일/컴포넌트 스타일링)

## 디렉토리 구조
```txt
docs/
  license-analysis-verification.md # 라이선스 분석 기능 검증 가이드
public/
  favicon-ossdoc.svg                # 서비스 파비콘
  vite.svg                          # Vite 기본 로고 이미지
src/
  app/
    config/
      env.js                        # API 기본 URL 환경 변수 설정
    layout/
      AppShell.jsx                  # 공통 헤더와 배경을 포함한 앱 레이아웃
    providers/
      AppProviders.jsx              # 인증과 라우터 전역 Provider 구성
    routes/
      index.jsx                     # 페이지 라우트와 인증 보호 라우트 정의
  assets/
    react.svg                       # React 로고 이미지
  features/
    auth/
      api/
        authApi.js                  # 로그인, 회원 정보, 로그아웃 API
      components/
        LoginModal.jsx              # Google 로그인 안내 모달
        SignupModal.jsx             # Google 회원가입 안내 모달
      model/
        AuthContext.jsx             # 인증 상태와 사용자 정보 Context
    classmap/
      api/
        classMapApi.js              # 클래스 맵 분석 API
    githubStats/
      api/
        githubStatsApi.js           # GitHub 통계 조회 API
    license/
      components/
        LicenseActionGuide.jsx      # 라이선스별 대응 가이드
        LicenseAnalysisSection.jsx  # 라이선스 분석 결과 메인 영역
        LicenseDetailList.jsx       # 라이선스 상세 항목 목록
        LicenseEvidenceCard.jsx     # 분석 근거 카드
        LicenseEvidenceExplorer.jsx # 근거 검색과 출처 필터 UI
        LicenseMetricCard.jsx       # 라이선스 지표 카드
        LicenseReportActions.jsx    # 분석 보고서 다운로드 기능
        LicenseReviewChecklist.jsx  # 검토 체크리스트
        LicenseReviewNotice.jsx     # 경고와 검토 필요 항목 안내
        LicenseSectionNavigator.jsx # 분석 결과 섹션 내비게이션
      hooks/
        useLicenseAnalysisArtifact.js # 라이선스 산출물 조회 Hook
        useLicenseReviewChecklist.js  # 체크리스트 상태 관리 Hook
      lib/
        licenseNavigation.js        # 분석 페이지 경로 생성 유틸리티
      model/
        licenseAnalysisModel.js     # 분석 응답 정규화와 View Model 생성
        licenseArtifactResolver.js  # 라이선스 산출물 ID와 실패 상태 판별
        licenseDetailStateModel.js  # 라이선스 상세 화면 상태 계산
        licenseEvidenceModel.js     # 분석 근거 데이터 가공
        licenseReportModel.js       # Markdown·JSON 보고서 생성
        licenseReviewChecklistModel.js # 검토 체크리스트 항목과 진행률 생성
    membership/
      api/
        membershipApi.js            # 내 멤버십 정보 조회 API
    payment/
      api/
        paymentApi.js               # 토큰 결제 준비와 검증 API
      lib/
        portonePayment.js           # PortOne 결제 요청 연동
    run/
      api/
        runApi.js                   # 분석 실행, 진행 상태, 산출물 조회 API
      hooks/
        useRunProgressPolling.js    # 분석 진행 상태 Polling Hook
    token/
      api/
        tokenApi.js                 # 토큰 잔액과 사용 내역 조회 API
      components/
        AnalysisRequestConfirmModal.jsx # 분석 요청 확인 모달
        InsufficientTokenModal.jsx  # 토큰 부족 안내 모달
        ReanalysisConfirmModal.jsx  # 재분석 요청 확인 모달
      constants/
        tokenPolicy.js              # 기능별 토큰 비용 정책
  pages/
    Analy/
      components/
        AnalyzeProgressPanel.jsx    # 분석 단계별 진행 상태 패널
        ClassDiagramSection.jsx     # 클래스 관계 다이어그램 탐색 UI
        DirectoryStructureSection.jsx # 저장소 디렉터리 트리 UI
        LlmResultSection.jsx        # LLM 분석 산출물 탭과 상세 결과
        PackageClassDocsSection.jsx # 패키지·클래스·메서드 문서 UI
        RepoInfoSection.jsx         # 저장소 기본 정보 영역
        classMapWorkspace.jsx       # 서브시스템별 클래스 맵 작업 영역
      AnalyPage.jsx                 # 저장소 분석 실행과 결과 화면
    Auth/
      AuthRequiredPage.jsx          # 인증 필요 안내 화면
      LoginFailurePage.jsx          # 로그인 실패 화면
      LoginSuccessPage.jsx          # 로그인 성공 처리 화면
    GithubStats/
      GithubStatsPage.jsx           # GitHub 저장소 통계 대시보드
    Landing/
      components/
        SearchBar.jsx               # 저장소 주소 입력과 분석 요청 폼
        SearchHistory.jsx           # 최근 분석 실행 목록
      LandingPage.jsx               # 서비스 소개와 저장소 검색 화면
    License/
      LicenseAnalysisPage.jsx       # 라이선스 분석 상세 화면
    MyPage/
      MyPage.jsx                    # 회원 정보, 토큰 충전·내역 관리 화면
  shared/
    api/
      client.js                     # 공통 HTTP 요청과 API 오류 처리
    components/
      common/
        Header.jsx                  # 전역 내비게이션 헤더
    styles/
      globals.css                   # 전역 스타일과 화면별 공통 스타일
  main.jsx                          # React 애플리케이션 진입점
.gitignore                          # Git 추적 제외 규칙
eslint.config.js                    # ESLint 검사 규칙
index.html                          # Vite HTML 진입 문서
package-lock.json                   # npm 의존성 잠금 파일
package.json                        # 프로젝트 스크립트와 의존성 정의
README.md                           # 프로젝트 소개와 사용 문서
vercel.json                         # Vercel 배포 라우팅 설정
vite.config.js                      # Vite와 React 빌드 설정
```
