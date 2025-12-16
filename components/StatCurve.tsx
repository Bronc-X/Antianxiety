'use client';

export default function StatCurve() {
  // 0-12周的指数序列：起始50，终点85，中间有温和波动上升
  const weeklyIndex = [50, 53, 51, 54, 56, 59, 57, 61, 64, 68, 66, 80, 85];
  const startX = 30;
  const endX = 570;
  const innerW = endX - startX; // 540
  const yTop = 30;
  const yBottom = 170;
  const mapIndexToY = (v: number) => {
    // 0 → yBottom, 100 → yTop（值越大越靠上）
    const t = Math.max(0, Math.min(100, v)) / 100;
    return yBottom - (yBottom - yTop) * t;
  };
  const points = weeklyIndex.map((v, i) => {
    const x = startX + (innerW * i) / 12;
    const y = mapIndexToY(v);
    return { x, y };
  });
  const lineD = [
    `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
    ...points.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
  ].join(' ');
  const areaD = `${lineD} L ${endX} ${yBottom} L ${startX} ${yBottom} Z`;

  return (
    <svg viewBox="0 0 600 240" className="w-full h-48">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0B3D2E" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/*
        坐标轴与网格
        设定绘图区左右内边距与基线：startX=30, endX=570, x 轴 y=170
      */}
      <g>
        {/* X 轴 */}
        <line x1={startX} y1={yBottom} x2={endX} y2={yBottom} stroke="#0B3D2E" strokeOpacity="0.25" strokeWidth="1" />
        {/* Y 轴 */}
        <line x1={startX} y1={yTop} x2={startX} y2={yBottom} stroke="#0B3D2E" strokeOpacity="0.25" strokeWidth="1" />
        {/* X 轴刻度与标签（0-12 周，共3个月） */}
        {
          Array.from({ length: 13 }, (_, i) => i).map((w) => {
            const x = startX + (innerW * w) / 12;
            const isMonthBoundary = w % 4 === 0; // 大概每4周≈1个月
            return (
              <g key={w}>
                {/* 竖向网格线（淡） */}
                <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke="#0B3D2E" strokeOpacity="0.08" strokeWidth="1" />
                {/* 刻度 */}
                <line x1={x} y1={yBottom} x2={x} y2={yBottom + 5} stroke="#0B3D2E" strokeOpacity="0.5" strokeWidth="1" />
                {/* 标签 */}
                <text x={x} y={yBottom + 20} textAnchor="middle" fontSize="10" fill="#0B3D2E" opacity={isMonthBoundary ? 0.9 : 0.7}>
                  {w}周
                </text>
                {/* 月边界标签 */}
                {isMonthBoundary && w > 0 && (
                  <text x={x} y={yBottom + 34} textAnchor="middle" fontSize="10" fill="#0B3D2E" opacity="0.9">
                    第{w / 4}月
                  </text>
                )}
              </g>
            );
          })
        }
        {/* Y 轴标签（示例标尺） */}
        {
          [yTop, 80, 120, yBottom].map((y, idx) => (
            <g key={y}>
              <line x1={startX} y1={y} x2={endX} y2={y} stroke="#0B3D2E" strokeOpacity="0.08" strokeWidth="1" />
              <text x={startX - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#0B3D2E" opacity="0.7">
                {idx === 3 ? '0' : (3 - idx) * 25}
              </text>
            </g>
          ))
        }
        {/* Y 轴标题 */}
        <text x="12" y={(yTop + yBottom) / 2} textAnchor="middle" fontSize="10" fill="#0B3D2E" opacity="0.8" transform={`rotate(-90 12 ${(yTop + yBottom) / 2})`}>
          生理改善指数（0-100）
        </text>
      </g>

      {/* 曲线与面积填充（数据驱动） */}
      <path d={lineD} fill="none" stroke="#0B3D2E" strokeWidth="2" strokeLinecap="round" />
      <path d={areaD} fill="url(#g)" />
      {/* 轴标题 */}
      <text x="300" y="210" textAnchor="middle" fontSize="10" fill="#0B3D2E" opacity="0.7">时间（周）｜3个月</text>
      {/* 指数说明（与贝叶斯相关） */}
      <text x="300" y="230" textAnchor="middle" fontSize="10" fill="#0B3D2E" opacity="0.7">
        指数 = 归一化的后验置信度：P(Improvement | Signals, Actions) ∝ P(Signals, Actions | Improvement) × P(Improvement)
      </text>
    </svg>
  );
}


