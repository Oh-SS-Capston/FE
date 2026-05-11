/*
 * classMap API는 더 이상 프론트에서 직접 호출하지 않습니다.
 *
 * 기존 방식:
 * - 프론트가 POST /api/v1/class-map/build 직접 호출
 *
 * 변경 방식:
 * - 프론트는 POST /api/v1/runs만 호출
 * - 백엔드 pipeline worker가 classMap까지 자동 실행
 * - 프론트는 GET /api/v1/runs/{runId}/progress만 polling
 */