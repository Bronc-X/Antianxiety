export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-[#E7E1D6] bg-white p-6 shadow-sm text-center">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0B3D2E]/30 border-t-[#0B3D2E]" />
        <p className="text-sm text-[#0B3D2E]/70">页面加载中…</p>
      </div>
    </div>
  );
}
