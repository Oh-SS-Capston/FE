import { Box } from "lucide-react";

export default function ClassDiagramSection({ diagramSvg }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      {/* 상단 글로우 라인 */}
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />
      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <Box size={22} className="text-cyan-400" />
          Class Diagram
        </h3>

        {!diagramSvg ? (
          <div className="min-h-[200px] rounded-xl border border-white/10 bg-[#050508]/80 flex items-center justify-center p-6">
            <p className="text-gray-500 text-sm text-center leading-relaxed">
              아직 다이어그램이 없습니다.
              <br />
              <span className="text-gray-600">백엔드 연동 후 SVG 경로/텍스트를 연결하면 표시됩니다.</span>
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border border-white/10 bg-black/30 p-4">
            <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
          </div>
        )}
      </div>
    </section>
  );
}
