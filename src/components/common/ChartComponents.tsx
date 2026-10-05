import React, { useState } from 'react';

// --- 1. Area Line Chart ---
interface LineChartProps {
  data: { label: string; value: number; secondary?: number }[];
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
  valuePrefix?: string;
}

export const AreaLineChart: React.FC<LineChartProps> = ({
  data,
  primaryLabel = 'Primary',
  secondaryLabel,
  height = 220,
  valuePrefix = '$',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No trend data available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const width = 600; // viewBox coordinate space
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => [d.value, d.secondary ?? 0]);
  const maxValue = Math.max(...allValues, 10);
  const roundedMax = Math.ceil(maxValue * 1.15);

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / roundedMax) * chartHeight;

  // Build smooth Bézier path
  const makePath = (valKey: 'value' | 'secondary') => {
    let d = '';
    data.forEach((pt, i) => {
      const val = pt[valKey] ?? 0;
      const x = getX(i);
      const y = getY(val);
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prevX = getX(i - 1);
        const prevY = getY(data[i - 1][valKey] ?? 0);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpX2 = prevX + (x - prevX) / 2;
        d += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      }
    });
    return d;
  };

  const primaryPath = makePath('value');
  const secondaryPath = secondaryLabel ? makePath('secondary') : '';

  const primaryArea = `${primaryPath} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(
    0
  )} ${padding.top + chartHeight} Z`;

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{secondaryLabel}</span>
            </div>
          )}
        </div>
        {hoveredItem && (
          <div className="text-xs font-mono font-medium text-slate-700">
            {hoveredItem.label}: <span className="text-indigo-600 font-semibold">{valuePrefix}{hoveredItem.value.toLocaleString()}</span>
            {secondaryLabel && hoveredItem.secondary !== undefined && (
              <span className="text-emerald-600 ml-2">/ {valuePrefix}{hoveredItem.secondary.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const gridVal = Math.round(roundedMax * ratio);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono tabular-nums"
              >
                {valuePrefix}{gridVal >= 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
              </text>
            </g>
          );
        })}

        {/* Primary Area Fill & Line */}
        <path d={primaryArea} fill="url(#primaryAreaGrad)" />
        <path d={primaryPath} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />

        {/* Secondary Line if provided */}
        {secondaryLabel && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}

        {/* X Axis Labels & Interactive hover guides */}
        {data.map((item, i) => {
          const x = getX(i);
          const y = getY(item.value);
          const isHovered = hoverIndex === i;

          return (
            <g key={i}>
              {/* Vertical Guide on hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke="#94A3B8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {/* Point dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? '#4F46E5' : '#ffffff'}
                stroke="#4F46E5"
                strokeWidth={isHovered ? 2.5 : 2}
                className="transition-all"
              />

              {/* X Axis Label */}
              {(data.length <= 8 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {item.label}
                </text>
              )}

              {/* Full height transparent hit box for easy hovering */}
              <rect
                x={x - (chartWidth / (data.length - 1 || 1)) / 2}
                y={padding.top}
                width={chartWidth / (data.length - 1 || 1)}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- 2. Bar Comparison Chart ---
interface BarComparisonProps {
  data: {
    label: string;
    actual: number;
    predicted: number;
  }[];
  height?: number;
}

export const BarComparisonChart: React.FC<BarComparisonProps> = ({ data, height = 220 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-xs text-slate-400">No comparison data</div>;
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.actual, d.predicted]), 10);
  const roundedMax = Math.ceil(maxVal * 1.15);

  const padding = { top: 20, right: 15, bottom: 30, left: 40 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(22, (barGroupWidth - 12) / 2);

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span>
            <span>Actual Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
            <span>AI Predicted Demand</span>
          </div>
        </div>
        {hoverIndex !== null && data[hoverIndex] && (
          <div className="text-xs font-mono font-medium text-slate-700">
            {data[hoverIndex].label}: Actual <span className="font-semibold text-slate-900">{data[hoverIndex].actual}</span> / Pred <span className="font-semibold text-indigo-600">{data[hoverIndex].predicted}</span>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((r, i) => {
          const y = padding.top + chartHeight * (1 - r);
          const val = Math.round(roundedMax * r);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {data.map((item, i) => {
          const groupCenterX = padding.left + i * barGroupWidth + barGroupWidth / 2;
          const actualH = (item.actual / roundedMax) * chartHeight;
          const predictedH = (item.predicted / roundedMax) * chartHeight;

          const actualY = padding.top + chartHeight - actualH;
          const predictedY = padding.top + chartHeight - predictedH;

          const isHovered = hoverIndex === i;

          return (
            <g key={i}>
              {/* Actual Bar */}
              <rect
                x={groupCenterX - barWidth - 2}
                y={actualY}
                width={barWidth}
                height={actualH}
                fill={isHovered ? '#1E293B' : '#334155'}
                rx="2"
                className="transition-colors"
              />

              {/* Predicted Bar */}
              <rect
                x={groupCenterX + 2}
                y={predictedY}
                width={barWidth}
                height={predictedH}
                fill={isHovered ? '#4338CA' : '#6366F1'}
                rx="2"
                className="transition-colors"
              />

              {/* Label */}
              <text
                x={groupCenterX}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono"
              >
                {item.label.length > 9 ? `${item.label.substring(0, 8)}…` : item.label}
              </text>

              {/* Hover area */}
              <rect
                x={padding.left + i * barGroupWidth}
                y={padding.top}
                width={barGroupWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- 3. Category Donut / Breakdown Chart ---
interface CategoryDonutProps {
  categories: {
    category: string;
    productCount: number;
    inventoryValue: number;
    totalUnits: number;
  }[];
}

export const CategoryDonutChart: React.FC<CategoryDonutProps> = ({ categories }) => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  if (!categories || categories.length === 0) {
    return <div className="text-center py-6 text-xs text-slate-400">No category breakdown</div>;
  }

  const totalVal = categories.reduce((acc, c) => acc + c.inventoryValue, 0);
  const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#64748B'];

  let accumulatedAngle = 0;
  const slices = categories.map((cat, i) => {
    const fraction = totalVal > 0 ? cat.inventoryValue / totalVal : 1 / categories.length;
    const startAngle = accumulatedAngle;
    const angle = fraction * 360;
    accumulatedAngle += angle;
    return {
      ...cat,
      fraction,
      startAngle,
      angle,
      color: colors[i % colors.length],
    };
  });

  const size = 160;
  const radius = 65;
  const strokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut SVG */}
      <div className="relative shrink-0 w-40 h-40 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {slices.map((slice, i) => {
            const strokeDasharray = `${(slice.fraction * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
            const strokeDashoffset = -((slice.startAngle / 360) * circumference).toFixed(2);
            const isHovered = hoveredCat === slice.category;

            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredCat(slice.category)}
                onMouseLeave={() => setHoveredCat(null)}
              />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center pointer-events-none text-center">
          <span className="text-[11px] text-slate-400 font-medium">Total Value</span>
          <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
            ${totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-2 text-xs w-full">
        {slices.map((slice, i) => {
          const isHovered = hoveredCat === slice.category;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredCat(slice.category)}
              onMouseLeave={() => setHoveredCat(null)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isHovered ? 'bg-slate-50 border-slate-300' : 'border-transparent hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="font-medium text-slate-700 truncate">{slice.category}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                <span>${slice.inventoryValue.toLocaleString()}</span>
                <span>{Math.round(slice.fraction * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
