import { useMemo, useState } from "react";
import {
  ChevronDown,
  CircleDot,
  FileCode2,
  FolderTree,
  Loader2,
  Package,
  TriangleAlert,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePath(path) {
  return String(path ?? "").replaceAll("\\", "/");
}

function extractPackageName(directoryPath) {
  const normalized = normalizePath(directoryPath);

  const javaIndex = normalized.indexOf("src/main/java/");
  if (javaIndex >= 0) {
    return normalized
      .slice(javaIndex + "src/main/java/".length)
      .replaceAll("/", ".");
  }

  const kotlinIndex = normalized.indexOf("src/main/kotlin/");
  if (kotlinIndex >= 0) {
    return normalized
      .slice(kotlinIndex + "src/main/kotlin/".length)
      .replaceAll("/", ".");
  }

  return normalized.replaceAll("/", ".") || "default";
}

function buildPackageDocs(fileTreeDocs) {
  const directories = safeArray(fileTreeDocs?.directories);

  return directories
    .map((directory) => {
      const packagePath = directory.path ?? "default";
      const packageName = extractPackageName(packagePath);

      const classes = safeArray(directory.files).flatMap((file) => {
        const filePath = file.path ?? "";

        return safeArray(file.classes).map((clazz) => ({
          symbolId: clazz.symbolId ?? `${filePath}:${clazz.name}`,
          name: clazz.name ?? "UnnamedClass",
          summary: clazz.summary ?? "클래스 설명이 없습니다.",
          estimated: Boolean(clazz.estimated),
          filePath,
          methods: safeArray(clazz.methods).map((method) => ({
            symbolId: method.symbolId ?? `${filePath}:${clazz.name}:${method.name}`,
            name: method.name ?? "unnamedMethod",
            summary: method.summary ?? "메서드 설명이 없습니다.",
            estimated: Boolean(method.estimated),
            relatedRules: safeArray(method.relatedRules),
            relatedScenarios: safeArray(method.relatedScenarios),
          })),
        }));
      });

      return {
        packagePath,
        packageName,
        classes,
      };
    })
    .filter((pkg) => pkg.classes.length > 0)
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
}

function hasDocs(fileTreeDocs) {
  return buildPackageDocs(fileTreeDocs).length > 0;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function MethodItem({ method }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <CircleDot size={13} className="text-cyan-300" />

        <span className="break-all text-sm font-semibold text-cyan-100">
          {method.name}
        </span>

        {method.estimated && (
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
            estimated
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-400">{method.summary}</p>

      {(method.relatedRules.length > 0 || method.relatedScenarios.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {method.relatedRules.map((rule) => (
            <span
              key={`rule-${method.symbolId}-${rule}`}
              className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] text-purple-200"
            >
              {rule}
            </span>
          ))}

          {method.relatedScenarios.map((scenario) => (
            <span
              key={`scenario-${method.symbolId}-${scenario}`}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200"
            >
              {scenario}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassItem({ clazz, open, onToggle }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileCode2 size={16} className="text-purple-300" />

            <h4 className="break-all text-sm font-bold text-gray-100">
              {clazz.name}
            </h4>

            {clazz.estimated && (
              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                estimated
              </span>
            )}

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-400">
              methods {clazz.methods.length}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-300">
            {clazz.summary}
          </p>

          {clazz.filePath && (
            <p className="mt-2 break-all text-xs text-gray-600">
              {clazz.filePath}
            </p>
          )}
        </div>

        <ChevronDown
          size={17}
          className={`mt-1 shrink-0 text-gray-500 transition ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 bg-black/10 p-4">
          {clazz.methods.length === 0 ? (
            <EmptyState text="표시할 메서드 설명이 없습니다." />
          ) : (
            clazz.methods.map((method) => (
              <MethodItem key={method.symbolId} method={method} />
            ))
          )}
        </div>
      )}
    </article>
  );
}

function PackageItem({ pkg, open, onToggle, openClassIds, onToggleClass }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Package size={17} className="shrink-0 text-cyan-300" />

            <h3 className="break-all text-base font-bold text-gray-100">
              {pkg.packageName}
            </h3>
          </div>

          <p className="mt-1 break-all text-xs text-gray-600">
            {pkg.packagePath}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-gray-400">
            {pkg.classes.length} classes
          </span>

          <ChevronDown
            size={18}
            className={`text-gray-500 transition ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          {pkg.classes.map((clazz) => (
            <ClassItem
              key={clazz.symbolId}
              clazz={clazz}
              open={Boolean(openClassIds[clazz.symbolId])}
              onToggle={() => onToggleClass(clazz.symbolId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PackageClassDocsSection({
  fileTreeDocs,
  loading = false,
  error = null,
}) {
  const packages = useMemo(() => buildPackageDocs(fileTreeDocs), [fileTreeDocs]);

  const [openPackages, setOpenPackages] = useState({});
  const [openClassIds, setOpenClassIds] = useState({});

  const fallbackApplied = Boolean(fileTreeDocs?.fallbackApplied);

  const togglePackage = (packageName) => {
    setOpenPackages((prev) => ({
      ...prev,
      [packageName]: !prev[packageName],
    }));
  };

  const toggleClass = (classId) => {
    setOpenClassIds((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.45), rgba(250,204,21,0.45), transparent)",
        }}
      />

      <div className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-100">
              <FolderTree size={21} className="text-cyan-300" />
              Package Class Docs
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              BE에서 생성한 LLM 파일 트리 문서 결과를 기반으로 패키지별 클래스와
              메서드 설명을 보여줍니다.
            </p>

            {fallbackApplied && (
              <p className="mt-2 text-xs text-yellow-200/80">
                일부 설명은 LLM 응답 실패 시 생성된 fallback 결과일 수 있습니다.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Packages
              </p>
              <p className="mt-1 text-lg font-bold text-gray-100">
                {packages.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Classes
              </p>
              <p className="mt-1 text-lg font-bold text-gray-100">
                {packages.reduce((sum, pkg) => sum + pkg.classes.length, 0)}
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-gray-300">
            <Loader2 size={16} className="animate-spin" />
            패키지별 클래스 문서를 불러오는 중입니다.
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/10 px-4 py-4 text-sm text-red-200">
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !hasDocs(fileTreeDocs) && (
          <div className="mt-5">
            <EmptyState text="아직 표시할 패키지/클래스 문서가 없습니다. LLM_FILE_TREE_DOCS 산출물이 생성되면 표시됩니다." />
          </div>
        )}

        {packages.length > 0 && (
          <div className="mt-5 space-y-4">
            {packages.map((pkg) => (
              <PackageItem
                key={pkg.packageName}
                pkg={pkg}
                open={Boolean(openPackages[pkg.packageName])}
                onToggle={() => togglePackage(pkg.packageName)}
                openClassIds={openClassIds}
                onToggleClass={toggleClass}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}