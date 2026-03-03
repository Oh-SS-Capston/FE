export default function ClassDiagramSection({ diagramSvg }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
      <h3 className="text-xl font-bold mb-4">Class Diagram</h3>

      {!diagramSvg ? (
        <p className="text-white/70">
          아직 다이어그램이 없습니다. (백엔드 연동 후 SVG 경로/텍스트를 연결하면 표시됩니다.)
        </p>
      ) : (
        <div className="overflow-auto rounded-xl border border-white/10 bg-black/30 p-4">
          {/* SVG 문자열을 받아서 렌더한다는 가정 */}
          <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
        </div>
      )}
    </section>
  );
}