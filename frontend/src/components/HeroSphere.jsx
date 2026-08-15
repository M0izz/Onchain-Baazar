import React, { useMemo } from "react";

export default function HeroSphere({ className = "" }) {
  // Generate mathematically precise 3D Geodesic Wireframe Sphere Mesh
  const { nodes, edges, limbNodes } = useMemo(() => {
    const pts = [];
    const edgeList = [];
    const limbPts = [];

    const numLat = 14;
    const numLng = 22;
    const R = 250;
    const cx = 400;
    const cy = 400;

    // 3D rotation angles (tilt and rotate sphere to match reference image)
    const rotY = 0.85;
    const rotX = -0.32;

    const grid = [];

    for (let i = 0; i <= numLat; i++) {
      grid[i] = [];
      const lat = (Math.PI * i) / numLat - Math.PI / 2;
      const y0 = R * Math.sin(lat);
      const r0 = R * Math.cos(lat);

      for (let j = 0; j < numLng; j++) {
        const lng = (2 * Math.PI * j) / numLng;
        const x0 = r0 * Math.cos(lng);
        const z0 = r0 * Math.sin(lng);

        // Rotate around Y
        const x1 = x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
        const z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);

        // Rotate around X
        const y2 = y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y0 * Math.sin(rotX) + z1 * Math.cos(rotX);

        const screenX = cx + x1;
        const screenY = cy + y2;

        const nodeObj = {
          id: `${i}-${j}`,
          x: Number(screenX.toFixed(1)),
          y: Number(screenY.toFixed(1)),
          z: Number(z2.toFixed(1)),
          i,
          j
        };

        grid[i][j] = nodeObj;

        // Collect front-facing nodes
        if (z2 > -110) {
          const normZ = (z2 + 110) / (R + 110);
          pts.push({
            ...nodeObj,
            opacity: Math.max(0.2, Math.min(1.0, normZ * 0.95 + 0.15)),
            r: normZ > 0.7 ? 2.4 : normZ > 0.4 ? 1.8 : 1.2
          });

          // Check if node is near the lit left rim edge
          if (screenX < cx - 40 && Math.abs(z2) < 140) {
            limbPts.push(nodeObj);
          }
        }
      }
    }

    // Build 3D geodesic triangulated mesh edges
    for (let i = 0; i < numLat; i++) {
      for (let j = 0; j < numLng; j++) {
        const current = grid[i][j];
        const right = grid[i][(j + 1) % numLng];
        const down = grid[i + 1][j];
        const diag = grid[i + 1][(j + 1) % numLng];

        // Horizontal edge
        if (current.z > -100 || right.z > -100) {
          const avgZ = (current.z + right.z) / 2;
          const alpha = Math.max(0.08, Math.min(0.65, (avgZ + 100) / (R + 100)));
          edgeList.push({
            x1: current.x,
            y1: current.y,
            x2: right.x,
            y2: right.y,
            opacity: alpha.toFixed(2)
          });
        }

        // Vertical edge
        if (current.z > -100 || down.z > -100) {
          const avgZ = (current.z + down.z) / 2;
          const alpha = Math.max(0.08, Math.min(0.65, (avgZ + 100) / (R + 100)));
          edgeList.push({
            x1: current.x,
            y1: current.y,
            x2: down.x,
            y2: down.y,
            opacity: alpha.toFixed(2)
          });
        }

        // Diagonal triangulation edge for 3D geodesic mesh
        if ((i + j) % 2 === 0) {
          if (current.z > -100 || diag.z > -100) {
            const avgZ = (current.z + diag.z) / 2;
            const alpha = Math.max(0.05, Math.min(0.5, (avgZ + 100) / (R + 100)));
            edgeList.push({
              x1: current.x,
              y1: current.y,
              x2: diag.x,
              y2: diag.y,
              opacity: alpha.toFixed(2)
            });
          }
        }
      }
    }

    return { nodes: pts, edges: edgeList, limbNodes: limbPts };
  }, []);

  // Background scatter constellation dots outside main sphere on the left
  const scatterDots = [
    { cx: 110, cy: 150, r: 1.4, opacity: 0.35 },
    { cx: 80, cy: 260, r: 1.8, opacity: 0.45 },
    { cx: 95, cy: 380, r: 2.0, opacity: 0.5 },
    { cx: 70, cy: 500, r: 1.5, opacity: 0.4 },
    { cx: 120, cy: 620, r: 1.3, opacity: 0.35 },
    { cx: 45, cy: 330, r: 1.2, opacity: 0.3 },
    { cx: 140, cy: 220, r: 1.6, opacity: 0.4 },
  ];

  return (
    <div
      className={`hero-sphere-container pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Node Glow & Rim Light Filters */}
          <filter id="globe-rim-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-point-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Translucent Glass Sphere Body Gradient (No solid black disk!) */}
          <radialGradient id="sphere-glass-body" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="var(--navy, #14213D)" stopOpacity="0.25" />
            <stop offset="50%" stopColor="var(--navy, #14213D)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Glowing Rim Arc Gradient */}
          <linearGradient id="rim-arc-gradient" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="var(--brass, #8C6A1E)" stopOpacity="0.3" />
            <stop offset="40%" stopColor="var(--navy, #14213D)" stopOpacity="0.95" />
            <stop offset="75%" stopColor="var(--brass, #8C6A1E)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Subtle Translucent Glass Atmosphere (NO Solid Black Disk) */}
        <circle
          cx="400"
          cy="400"
          r="252"
          fill="url(#sphere-glass-body)"
        />

        {/* 2. Deep Background Scatter Nodes & Connecting Lines */}
        <g stroke="var(--navy, #14213D)" strokeWidth="0.6" opacity="0.3">
          <line x1="45" y1="330" x2="80" y2="260" />
          <line x1="80" y1="260" x2="110" y2="150" />
          <line x1="80" y1="260" x2="95" y2="380" />
          <line x1="95" y1="380" x2="70" y2="500" />
          <line x1="70" y1="500" x2="120" y2="620" />
          <line x1="140" y1="220" x2="190" y2="230" />
        </g>

        <g>
          {scatterDots.map((d, idx) => (
            <circle
              key={`scat-${idx}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill="var(--brass, #8C6A1E)"
              opacity={d.opacity}
            />
          ))}
        </g>

        {/* 3. 3D Geodesic Wireframe Mesh Lines */}
        <g stroke="var(--navy, #14213D)" strokeWidth="1.2">
          {edges.map((e, idx) => (
            <line
              key={`edge-${idx}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeOpacity={Math.min(1, parseFloat(e.opacity) * 1.4)}
            />
          ))}
        </g>

        {/* 4. 3D Vertex Node Points (Glowing dots at grid intersections) */}
        <g filter="url(#node-point-glow)">
          {nodes.map((n) => (
            <circle
              key={`node-${n.id}`}
              cx={n.x}
              cy={n.y}
              r={(n.r * 1.3).toFixed(1)}
              fill="var(--brass, #8C6A1E)"
              opacity={Math.min(1, n.opacity * 1.25)}
            />
          ))}
        </g>

        {/* 5. Bright Glowing Rim Arc (Limb light tracing left edge) */}
        <path
          d="M 280 160 A 250 250 0 0 0 290 640"
          fill="none"
          stroke="url(#rim-arc-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#globe-rim-glow)"
        />
        <path
          d="M 280 160 A 250 250 0 0 0 290 640"
          fill="none"
          stroke="var(--brass, #8C6A1E)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="1.0"
        />

        {/* 6. Glowing Limb Edge Node Dots */}
        <g filter="url(#node-point-glow)">
          {limbNodes.slice(0, 10).map((ln) => (
            <circle
              key={`limb-node-${ln.id}`}
              cx={ln.x}
              cy={ln.y}
              r="3.4"
              fill="var(--brass, #8C6A1E)"
              opacity="1.0"
            />
          ))}
        </g>

      </svg>
    </div>
  );
}
