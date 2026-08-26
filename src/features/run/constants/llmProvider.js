/*
 * 분석 요청에 사용할 LLM 제공자 목록입니다.
 * 값은 서버 RepoRunCreateRequest.llmProvider와 그대로 매칭됩니다.
 */
export const LLM_PROVIDERS = {
  CLAUDE: "claude",
  OLLAMA: "ollama",
};

export const LLM_PROVIDER_OPTIONS = [
  {
    value: LLM_PROVIDERS.CLAUDE,
    label: "Claude",
    description: "클라우드 기반 고성능 분석",
  },
  {
    value: LLM_PROVIDERS.OLLAMA,
    label: "Ollama",
    description: "로컬 실행 모델로 분석",
  },
];

export const DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.CLAUDE;
