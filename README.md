# Oh! SS (Capstone)

GitHub 레포지토리를 입력하면 정적 분석 기반 산출물(그래프/심볼/엣지/근거)을 생성하고,
UI에서 Public API, 다이어그램, 시나리오 등을 탐색할 수 있는 프로젝트입니다.

---

## 주요 특징

- **Landing Page**
  - GitHub 레포 입력 (URL 또는 `owner/repo`)
  - 검색 히스토리(로컬 저장)
  - 추천 레포 빠른 실행
- **Analyze Page**
  - 레포 정보(언어/스타/포크/라이선스 등)
  - 디렉토리 구조 탐색(간단)
  - (추후) 분석 산출물(Artifacts/Graph/Diagram/Scenario) 탐색 확장 예정
- **Auth UI**
  - 로그인 팝업 / 회원가입 팝업 (현재는 UI 중심, API 연동은 TODO)

---

## 스택

### Frontend
- React + Vite
- react-router-dom
- lucide-react (icons)
- Tailwind CSS (전역 스타일/컴포넌트 스타일링)

## 디렉토리 구조 (+향후 추가 예정 포함)
```txt
src/
  app/
    providers/
      AppProviders.jsx          # (기존) RouterProvider + (추후) QueryClientProvider 조립
    routes/
      index.jsx                 # (기존) 라우트 정의
    layout/
      AppShell.jsx              # (기존) 헤더/컨텐츠 레이아웃 (Landing/Analy 공통)
    config/
      env.js                    # (추가) VITE_API_BASE_URL 등 환경값 읽기

  pages/
    Landing/
      LandingPage.jsx           # (기존) 검색 + 검색 히스토리(메인 화면)
      components/
        SearchBar.jsx           # (기존) 입력창 + 버튼
        SearchHistory.jsx       # (기존) 히스토리 목록
        HistoryItem.jsx         # (추가) 히스토리 단일 row 컴포넌트
    Analy/
      AnalyPage.jsx             # (기존) 분석 페이지(현재는 repo 정보/디렉토리/다이어그램)
      components/
        RunSummaryCard.jsx      # (추가/대체 가능) repo 요약 카드(현재 RepoInfoSection 역할을 이 이름으로)
        RunStatusBadge.jsx      # (추가) QUEUED/RUNNING/SUCCESS/FAILED 배지
        ArtifactPanel.jsx       # (추가) job_manifest/build_manifest 링크 모음(백엔드 연동용)
        DiagramViewer.jsx       # (추가/대체 가능) svg/plantuml 렌더 (현재 ClassDiagramSection 역할을 이 이름으로)
        SymbolSearchInline.jsx  # (추가) 분석 페이지 내 심볼 검색(간단 UI)

  features/
    auth/
      api/
        authApi.js              # (추가) login/signup API 호출(현재는 TODO)
      components/
        LoginModal.jsx          # (기존) 로그인 팝업
        SignupModal.jsx         # (기존) 회원가입 팝업
      model/
        authStore.js            # (선택 추가) zustand로 토큰/유저 상태
      index.js                  # (추가) export 모음

    run/
      api/
        runApi.js               # (추가) createRun/getRun/listRuns/pollRunStatus
      components/
        RunCreateForm.jsx       # (선택 추가) repo URL 입력 폼(landing에서 SearchBar 대신 사용 가능)
      model/
        runKeys.js              # (추가) React Query key 모음
      index.js                  # (추가) export 모음

    search/
      api/
        searchApi.js            # (추가) 심볼 검색 API(백엔드 연동용)
      components/
        SymbolResultList.jsx    # (추가) 검색 결과 목록
      model/
        searchHistoryStore.js   # (기존) 로컬스토리지 기반 검색 히스토리 저장

  shared/
    api/
      client.js                 # (추가) axios 인스턴스 + baseURL + 인터셉터
      httpError.js              # (추가) 에러 공통 처리(토스트 메시지 변환 등)
    components/
      ui/
        Modal.jsx               # (선택 추가) 공용 모달 (Login/Signup에서 사용 가능)
        Button.jsx              # (선택 추가) 공용 버튼
        Input.jsx               # (선택 추가) 공용 인풋
        Tabs.jsx                # (선택 추가) 탭 UI (AnalyPage에 유용)
        Spinner.jsx             # (선택 추가) 로딩 UI
        ToastHost.jsx           # (선택 추가) 토스트 루트
      common/
        Header.jsx              # (기존) 상단바(로그인/회원가입 버튼)
    lib/
      storage.js                # (선택 추가) localStorage helper (historyStore가 커지면 분리)
      format.js                 # (선택 추가) 날짜/바이트 포맷
      validators.js             # (선택 추가) URL 검증/정규화
    styles/
      globals.css               # (기존) 전역 스타일 (index.css에서 이동한 파일)

  main.jsx                      # (기존) React entry
  ```