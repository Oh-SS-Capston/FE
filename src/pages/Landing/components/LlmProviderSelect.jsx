import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import ClaudeIcon from "../../../shared/components/icons/ClaudeIcon";
import OllamaIcon from "../../../shared/components/icons/OllamaIcon";
import {
  LLM_PROVIDERS,
  LLM_PROVIDER_OPTIONS,
} from "../../../features/run/constants/llmProvider";

const providerIcon = {
  [LLM_PROVIDERS.CLAUDE]: ClaudeIcon,
  [LLM_PROVIDERS.OLLAMA]: OllamaIcon,
};

/* Ollama 브랜드 색은 검정이라 어두운 배경에서 보이지 않아 본문색을 씁니다. */
const providerIconTone = {
  [LLM_PROVIDERS.CLAUDE]: "text-[#D97757]",
  [LLM_PROVIDERS.OLLAMA]: "text-[var(--text-primary)]",
};

/*
 * 검색바 왼쪽에서 분석에 사용할 LLM 제공자를 고르는 드롭다운입니다.
 * 네이티브 select는 다크 테마 스타일링이 어려워 버튼 + 목록 형태로 구성했습니다.
 */
export default function LlmProviderSelect({
  value,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected =
    LLM_PROVIDER_OPTIONS.find((option) => option.value === value) ??
    LLM_PROVIDER_OPTIONS[0];

  const SelectedIcon = providerIcon[selected.value] ?? ClaudeIcon;

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (option) => {
    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="분석에 사용할 LLM 제공자 선택"
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45 disabled:cursor-not-allowed disabled:opacity-55 ${
          open
            ? "border-cyan-300/45 bg-[var(--surface-hover)] text-[var(--text-primary)]"
            : "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        }`}
      >
        <SelectedIcon
          size={16}
          className={`shrink-0 ${providerIconTone[selected.value] ?? ""}`}
        />

        <span className="hidden sm:inline">{selected.label}</span>

        <ChevronDown
          size={16}
          className={`text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="LLM 제공자"
          className="absolute left-0 top-[calc(100%+10px)] z-30 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.6)]"
        >
          {LLM_PROVIDER_OPTIONS.map((option) => {
            const OptionIcon = providerIcon[option.value] ?? ClaudeIcon;
            const isSelected = option.value === selected.value;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--surface-hover)]"
                      : "hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <OptionIcon
                    size={16}
                    className={`shrink-0 ${
                      isSelected
                        ? providerIconTone[option.value] ?? ""
                        : "text-[var(--text-muted)]"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      {option.label}
                    </span>

                    <span className="block text-xs text-[var(--text-muted)]">
                      {option.description}
                    </span>
                  </span>

                  {isSelected && (
                    <Check size={16} className="shrink-0 text-cyan-200" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
