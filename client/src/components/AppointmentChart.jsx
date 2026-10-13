import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Interactive SVG Chart replicating the "Total attendance report" line graph in the screenshot.
 */
const AppointmentChart = () => {
  const pathRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      gsap.fromTo(
        pathRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' }
      );
    }

    if (dotsRef.current.length > 0) {
      gsap.fromTo(
        dotsRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.8, ease: 'back.out(2)' }
      );
    }
  }, []);

  const points = [
    { x: 30, y: 110, val: '8' },
    { x: 90, y: 45, val: '18' },
    { x: 150, y: 70, val: '12' },
    { x: 210, y: 30, val: '22' },
    { x: 270, y: 95, val: '9' },
    { x: 330, y: 40, val: '19' },
    { x: 390, y: 80, val: '11' },
  ];

  // SVG smooth spline path
  const pathD = "M 30,110 C 60,60 75,45 90,45 C 115,45 130,70 150,70 C 180,70 195,30 210,30 C 235,30 250,95 270,95 C 295,95 310,40 330,40 C 355,40 370,80 390,80";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-[#171825] text-base">Weekly Activity & Slots</h3>
          <p className="text-xs font-semibold text-[#8e94a5]">Consultation & booking throughput</p>
        </div>
        <select className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full border-none outline-none cursor-pointer">
          <option>Weekly</option>
          <option>Monthly</option>
        </select>
      </div>

      <div className="relative w-full h-44 sm:h-48">
        <svg viewBox="0 0 420 140" className="w-full h-full overflow-visible">
          {/* Subtle grid lines */}
          <line x1="20" y1="20" x2="400" y2="20" stroke="#f1f3f9" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="55" x2="400" y2="55" stroke="#f1f3f9" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="90" x2="400" y2="90" stroke="#f1f3f9" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="125" x2="400" y2="125" stroke="#f1f3f9" strokeWidth="1" />

          {/* Curve */}
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="#6956e5"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Dots & Callouts */}
          {points.map((p, i) => (
            <g key={i} ref={(el) => (dotsRef.current[i] = el)}>
              <circle cx={p.x} cy={p.y} r="5" fill="#14151b" stroke="#ffffff" strokeWidth="2" />
              {/* Highlight callout on peak points */}
              {(i === 1 || i === 3 || i === 5) && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-[9px] font-extrabold fill-slate-500"
                >
                  {p.val}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Days labels */}
      <div className="flex justify-between px-2 text-[11px] font-bold text-[#8e94a5] mt-1">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
};

export default AppointmentChart;
