interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: center + radius * (value / 100) * Math.cos(angle),
      y: center + radius * (value / 100) * Math.sin(angle),
    };
  };

  const points = data.map((d, i) => getPoint(i, d.value));
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = data.map((_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        });
        return (
          <polygon key={level} points={pts.join(" ")} fill="none" stroke="hsl(215,20%,18%)" strokeWidth="1" />
        );
      })}

      {/* Axes */}
      {data.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="hsl(215,20%,18%)" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <polygon points={polygon} fill="hsl(212,100%,67%,0.15)" stroke="hsl(212,100%,67%)" strokeWidth="2" />

      {/* Points and labels */}
      {data.map((d, i) => {
        const p = getPoint(i, d.value);
        const labelP = getPoint(i, 120);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="hsl(212,100%,67%)" />
            <text
              x={labelP.x}
              y={labelP.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "10px", fontFamily: "Inter" }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
