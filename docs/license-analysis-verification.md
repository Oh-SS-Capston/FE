# 라이선스 분석 기능 검증 가이드

이 문서는 대표 라이선스 분석 기능을 프런트에서 직접 확인할 때 사용하는 검증 기준입니다.
목표는 화면이 예쁘게 보이는지뿐 아니라, 백엔드 산출물과 프런트 표시가 같은 의미를 유지하는지 확인하는 것입니다.

## 검증 전 준비

- 백엔드 서버가 실행 중이어야 합니다.
- 프런트 개발 서버가 실행 중이어야 합니다.
- GitHub 저장소 분석을 1회 이상 완료해야 합니다.
- 분석 결과의 `runId`를 확인할 수 있어야 합니다.
- 테스트 저장소는 루트에 `LICENSE`, `README`, `pom.xml`, `build.gradle` 중 하나 이상이 있는 저장소를 우선 사용합니다.

## 권장 테스트 저장소 기준

특정 저장소 이름보다 아래 조건을 만족하는 저장소를 섞어서 확인합니다.

| 케이스 | 목적 | 확인 포인트 |
| --- | --- | --- |
| 명확한 LICENSE 파일이 있는 저장소 | 대표 SPDX 자동 판단 확인 | LICENSE 원문과 화면의 SPDX ID가 같은 의미인지 확인 |
| README에 라이선스 문구가 있는 저장소 | README 근거 표시 확인 | 근거 목록에 README 계열 source가 표시되는지 확인 |
| Maven/Gradle 빌드 파일에 라이선스 메타가 있는 저장소 | 빌드 파일 근거 표시 확인 | `pom.xml`, `build.gradle` 근거가 검색/필터에 잡히는지 확인 |
| 라이선스가 없거나 애매한 저장소 | UNKNOWN/검토 필요 확인 | `UNKNOWN`, 수동 검토 경고, 빈 근거 상태가 자연스럽게 보이는지 확인 |

테스트할 때는 기대 SPDX 값을 문서에 고정하지 말고, 해당 저장소의 현재 LICENSE 원문을 직접 열어 화면 값과 비교합니다.

## 기본 진입 흐름

1. 랜딩 페이지에서 GitHub 저장소를 입력합니다.
2. 분석 결과 페이지로 이동합니다.
3. 분석이 완료될 때까지 진행 상태를 확인합니다.
4. 대표 라이선스 섹션이 보이면 `상세 보기`로 이동합니다.
5. 주소가 `/license-analysis?runId={runId}&repo={repo}` 형태인지 확인합니다.

## 상세 페이지 정상 검증

### 1. 상단 정보

- `License Center` 배지가 보입니다.
- 진행 상태 pill이 `COMPLETED`, `FAILED`, `RUNNING` 등 현재 run 상태를 표시합니다.
- Repository 영역에 repo 값이 표시됩니다.
- 새로고침 후에도 `runId` query string만으로 페이지가 다시 로드됩니다.

### 2. 리포트 액션

- 분석 결과가 있을 때만 `리포트 액션` 패널이 보입니다.
- `Markdown 복사`를 누르면 이슈/PR에 붙일 수 있는 요약이 클립보드에 들어갑니다.
- `Markdown 다운로드`를 누르면 `license-report-{runId}.md` 파일이 생성됩니다.
- `JSON 다운로드`를 누르면 원본 산출물을 포함한 `license-report-{runId}.json` 파일이 생성됩니다.
- 브라우저 클립보드 권한이 막힌 경우 경고 메시지가 표시됩니다.

### 3. 섹션 네비게이션

- 분석 결과가 있을 때 `요약`, `검토 가이드`, `체크리스트`, `근거 탐색` 링크가 보입니다.
- 각 링크를 누르면 해당 섹션으로 이동합니다.
- 분석 결과가 아직 없을 때는 존재하지 않는 섹션 링크가 보이지 않습니다.

### 4. 대표 라이선스 요약

- SPDX ID가 가장 크게 보입니다.
- display name, family, confidence, review level이 표시됩니다.
- `검토 필요` 또는 `자동 판단 가능` 배지가 표시됩니다.
- permissions, obligations, notices 목록이 표시됩니다.
- 근거가 없으면 빈 근거 안내가 표시됩니다.

### 5. 검토 가이드

- 대표 라이선스 상태에 따라 판단 메시지가 달라집니다.
- `UNKNOWN`이면 수동 확인 중심 문구가 표시됩니다.
- GPL/AGPL 계열이면 배포 조건 확인 문구가 표시됩니다.
- 의무사항, 근거 파일, 검토 경고에 맞는 다음 행동 카드가 표시됩니다.

### 6. 수동 검토 체크리스트

- runId 기준으로 체크 상태가 저장됩니다.
- 체크 후 새로고침해도 상태가 유지됩니다.
- `초기화`를 누르면 현재 run의 체크 상태가 모두 해제됩니다.
- SPDX나 repo가 달라진 다른 run에서는 이전 체크 상태가 섞이지 않습니다.

### 7. 판단 근거 탐색

- Evidence, Sources, Review 요약 숫자가 표시됩니다.
- 검색어로 파일 경로, source, evidence type, snippet을 찾을 수 있습니다.
- Source 필터를 바꾸면 근거 목록이 필터링됩니다.
- `경로 복사` 버튼은 파일 경로만 복사합니다.
- `근거 복사` 버튼은 evidence id, path, line, source, type, snippet을 함께 복사합니다.
- 긴 snippet은 `전체 보기`와 `접기`로 전환됩니다.

## 예외 상태 검증

### runId 없음

- `/license-analysis`처럼 `runId` 없이 진입합니다.
- `라이선스 분석 실행 ID가 없습니다.` 안내가 표시됩니다.
- 홈으로 돌아갈 수 있습니다.

### 진행 상태 조회 실패

- 백엔드 서버를 끄거나 잘못된 runId로 진입합니다.
- 진행 상태 조회 실패 안내가 표시됩니다.
- 페이지 전체가 깨지지 않고 summary 영역은 대기/경고 상태를 유지합니다.

### 분석 진행 중

- 아직 `RUNNING` 상태인 runId로 진입합니다.
- `대표 라이선스 산출물을 생성하는 중입니다.` 안내가 표시됩니다.
- 상세 섹션은 산출물이 도착한 뒤 표시됩니다.

### LICENSE 단계 실패

- progress 응답의 `failedSteps`에 `stage: "LICENSE"`가 있는 경우를 확인합니다.
- `라이선스 분석 단계가 실패했습니다.` 안내와 실패 메시지가 표시됩니다.

### artifactId 누락

- 분석은 완료됐지만 progress 응답에 라이선스 artifactId가 없는 경우를 확인합니다.
- `완료된 분석에서 라이선스 산출물을 찾지 못했습니다.` 안내가 표시됩니다.
- 이 경우 백엔드의 artifact 필드명 또는 LICENSE 단계 저장 로직을 확인합니다.

### artifact content 비어 있음

- artifactId는 있지만 artifact API의 content가 `null`인 경우를 확인합니다.
- `라이선스 분석 산출물 내용이 비어 있습니다.` 오류가 표시됩니다.

## 산출물 필드 확인 기준

프런트는 백엔드 응답의 camelCase와 snake_case를 모두 흡수하도록 구성되어 있습니다.
아래 필드 중 일부가 다른 표기법으로 와도 화면이 깨지지 않아야 합니다.

| 의미 | 대표 필드 |
| --- | --- |
| schema version | `schemaVersion`, `schema_version` |
| generated time | `generatedAt`, `generated_at` |
| project license | `projectLicense`, `project_license` |
| display policy | `displayPolicy`, `display_policy` |
| review items | `reviewItems`, `review_items` |
| evidences | `evidences`, `evidenceList`, `evidence_list` |
| SPDX ID | `spdxId`, `spdx_id` |
| manual review | `requireManualReview`, `require_manual_review` |

## 완료 기준

- 대표 라이선스 요약이 분석 결과 페이지와 상세 페이지에서 모두 표시됩니다.
- 상세 페이지 새로고침 후에도 runId 기준으로 결과를 다시 불러옵니다.
- 리포트 액션, 체크리스트, 근거 탐색이 모두 동작합니다.
- UNKNOWN/실패/산출물 없음 상태에서 화면이 깨지지 않습니다.
- 실제 LICENSE 원문과 화면의 SPDX 판단이 같은 의미입니다.
