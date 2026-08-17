import React, { useEffect, useRef } from "react";

export default function HeroSphere({ className = "" }) {
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: -0.32, y: 0.85 });
  const velocityRef = useRef({ x: 0, y: 0.003 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const numLat = 14;
    const numLng = 22;
    const R = 230;
    const cx = 360;
    const cy = 360;

    // Scatter background constellation points
    const scatterDots = [
      { x: 90, y: 140, r: 1.4, opacity: 0.35 },
      { x: 60, y: 240, r: 1.8, opacity: 0.45 },
      { x: 75, y: 350, r: 2.0, opacity: 0.5 },
      { x: 50, y: 470, r: 1.5, opacity: 0.4 },
      { x: 100, y: 580, r: 1.3, opacity: 0.35 },
      { x: 30, y: 310, r: 1.2, opacity: 0.3 },
      { x: 120, y: 200, r: 1.6, opacity: 0.4 },
    ];

    const render = () => {
      // Auto-rotation + inertia
      if (!isDraggingRef.current) {
        rotRef.current.y += velocityRef.current.y;
        rotRef.current.x += velocityRef.current.x;
        // Dampen manual drag velocity back to idle slow rotation
        velocityRef.current.y = velocityRef.current.y * 0.96 + 0.0025 * 0.04;
        velocityRef.current.x = velocityRef.current.x * 0.96;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rotX = rotRef.current.x;
      const rotY = rotRef.current.y;

      // 1. Draw Translucent Glass Sphere Glow
      const glowGrad = ctx.createRadialGradient(cx - 50, cy - 50, 40, cx, cy, R + 10);
      glowGrad.addColorStop(0, "rgba(20, 33, 61, 0.22)");
      glowGrad.addColorStop(0.6, "rgba(20, 33, 61, 0.08)");
      glowGrad.addColorStop(1, "rgba(20, 33, 61, 0)");

      ctx.beginPath();
      ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 2. Draw Scatter background constellation
      ctx.strokeStyle = "rgba(20, 33, 61, 0.25)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(30, 310);
      ctx.lineTo(60, 240);
      ctx.lineTo(90, 140);
      ctx.moveTo(60, 240);
      ctx.lineTo(75, 350);
      ctx.lineTo(50, 470);
      ctx.lineTo(100, 580);
      ctx.stroke();

      scatterDots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 106, 30, ${d.opacity})`;
        ctx.fill();
      });

      // Compute 3D Nodes
      const grid = [];
      const nodes = [];

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

          const nodeObj = { x: screenX, y: screenY, z: z2, i, j };
          grid[i][j] = nodeObj;

          if (z2 > -100) {
            const normZ = (z2 + 100) / (R + 100);
            nodes.push({
              ...nodeObj,
              opacity: Math.max(0.15, Math.min(1.0, normZ * 0.95 + 0.15)),
              r: normZ > 0.7 ? 2.3 : normZ > 0.4 ? 1.7 : 1.1,
            });
          }
        }
      }

      // 3. Draw 3D Geodesic Wireframe Mesh Lines
      ctx.lineWidth = 1.1;
      for (let i = 0; i < numLat; i++) {
        for (let j = 0; j < numLng; j++) {
          const current = grid[i][j];
          const right = grid[i][(j + 1) % numLng];
          const down = grid[i + 1][j];
          const diag = grid[i + 1][(j + 1) % numLng];

          // Horizontal wireframe
          if (current.z > -90 || right.z > -90) {
            const avgZ = (current.z + right.z) / 2;
            const alpha = Math.max(0.06, Math.min(0.65, (avgZ + 90) / (R + 90)));
            ctx.strokeStyle = `rgba(20, 33, 61, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }

          // Vertical wireframe
          if (current.z > -90 || down.z > -90) {
            const avgZ = (current.z + down.z) / 2;
            const alpha = Math.max(0.06, Math.min(0.65, (avgZ + 90) / (R + 90)));
            ctx.strokeStyle = `rgba(20, 33, 61, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(down.x, down.y);
            ctx.stroke();
          }

          // Triangulated geodesic diagonal
          if ((i + j) % 2 === 0 && (current.z > -90 || diag.z > -90)) {
            const avgZ = (current.z + diag.z) / 2;
            const alpha = Math.max(0.04, Math.min(0.45, (avgZ + 90) / (R + 90)));
            ctx.strokeStyle = `rgba(20, 33, 61, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(diag.x, diag.y);
            ctx.stroke();
          }
        }
      }

      // 4. Draw Vertex Node Points (Gold/Brass glowing dots)
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 106, 30, ${n.opacity})`;
        ctx.fill();
      });

      // 5. Draw Left Glowing Limb Arc
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.65, Math.PI * 1.35);
      ctx.strokeStyle = "rgba(140, 106, 30, 0.75)";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "rgba(140, 106, 30, 0.6)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // ── Interactive Mouse & Touch Drag Controls ─────────────────────────────────
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;

    rotRef.current.y += deltaX * 0.008;
    rotRef.current.x -= deltaY * 0.008;

    velocityRef.current = {
      x: -deltaY * 0.002,
      y: deltaX * 0.002,
    };

    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
    const deltaY = e.touches[0].clientY - prevMouseRef.current.y;

    rotRef.current.y += deltaX * 0.008;
    rotRef.current.x -= deltaY * 0.008;

    velocityRef.current = {
      x: -deltaY * 0.002,
      y: deltaX * 0.002,
    };

    prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`hero-sphere-container cursor-grab active:cursor-grabbing select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      title="Click and drag to spin the onchain agent network globe"
    >
      <canvas
        ref={canvasRef}
        width={720}
        height={720}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
