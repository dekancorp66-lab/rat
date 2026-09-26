import * as THREE from "three";

function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("no 2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function grassTexture() {
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#6d8a4f";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillStyle = `rgba(${70 + Math.random() * 50},${110 + Math.random() * 50},${40 + Math.random() * 30},${0.35 + Math.random() * 0.4})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4);
    }
  });
}

export function tileTexture() {
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#9c3f28";
    ctx.fillRect(0, 0, s, s);
    const rows = 10;
    const cols = 8;
    const th = s / rows;
    const tw = s / cols;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : tw / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * tw + offset;
        const y = r * th;
        const shade = 140 + ((r * 13 + c * 17) % 40);
        ctx.fillStyle = `rgb(${shade + 40},${70 + (r % 3) * 8},${40 + (c % 4) * 6})`;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, tw - 2, th - 2, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(80,20,10,0.35)";
        ctx.stroke();
      }
    }
  });
}

export function woodTexture() {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(90,50,20,${0.04 + (i % 3) * 0.03})`;
      ctx.fillRect(0, i * (s / 18), s, 3);
    }
  });
}

export function stuccoTexture() {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#efe6d6";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(180,160,130,${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  });
}
