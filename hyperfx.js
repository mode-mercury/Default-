// HYPERFX v6.2 — JS (CodePen JS)
// Requires a canvas element with 2d context (ctx) and a source image.
// This file aggregates the requested occult/symbolic + stylization effects in one place.

/* -----------------------
   CONFIG + STATE HELPERS
----------------------- */
const HYPERFX = (() => {
  const BLEND_MODES = [
    "source-over",
    "screen",
    "overlay",
    "multiply",
    "lighter",
    "difference",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "exclusion"
  ];

  const HEBREW = "אבגדהוזחטיכלמנסעפצקרשת";
  const GREEK = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
  const TAROT = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement",
    "The World"
  ];
  const LEGACY_EFFECT_CATEGORIES = {
    DISTORTION: [
      "Void Warp", "Quantum Tunnel", "Black Hole", "Tornado", "Vortex", "Funnel",
      "Liquid Metal", "Plastic Wrap", "Bubble", "Crystallize"
    ],
    COLOR: [
      "Dank Colors", "Neon Shift", "Cyberpunk", "Vaporwave", "Retro CRT",
      "Sepia Tone", "Duotone", "Color Splash", "Hue Cycle", "RGB Shift"
    ],
    GLITCH: [
      "Data Moshing", "Pixel Sort", "Bit Crusher", "Buffer Overflow",
      "CRT Tearing", "Scanline Warp", "Signal Loss", "Compression Artifact"
    ],
    ARTISTIC: [
      "Pencil Sketch", "Oil Painting", "Watercolor", "Charcoal", "Stipple",
      "Pointillism", "Cross Hatch", "Comic Book"
    ],
    THREE_D: [
      "Depth Extrusion", "Light Rays", "3D Sphere", "Room Projection",
      "Parallax Scroll", "Hologram", "Wireframe", "Volumetric Fog"
    ],
    MIRROR: [
      "Kaleidoscope", "Infinity Mirror", "Hexagonal", "Radial Symmetry",
      "Tesselation", "Fractal Mirror", "Crystal Grid", "Mobius Strip"
    ],
    ESOTERIC: [
      "Sigil Burn", "Ritual Smoke", "Astral Projection", "Enochian Script",
      "Chaos Magick", "Occult Distortion", "Arcane Symbols", "Spirit Photography"
    ],
    BIOMECH: [
      "DNA Spiral", "Neuron Fire", "Cell Division", "Mycelium Network",
      "Capillary Flow", "Organic Growth", "Bioluminescence", "Tissue Warp"
    ],
    PSYCHEDELIC: [
      "Acid Wash", "Fractal Trip", "Kaleido Vision", "Mandelbrot Dive",
      "Infinity Loop", "Psychedelic Wave", "Vision Quest", "LSD Blotter"
    ],
    PIXEL: [
      "Advanced Pixelate", "CRT Scanlines", "8-Bit Dither", "Retro Composite",
      "VHS Static", "Old TV", "Arcade Cabinet", "Gameboy"
    ]
  };
  const AI_PROVIDERS = {
    free: [
      { id: "flux", name: "FLUX", icon: "fas fa-bolt" },
      { id: "flux-pro", name: "FLUX Pro", icon: "fas fa-crown" },
      { id: "dreamshaper", name: "DreamShaper", icon: "fas fa-cloud" },
      { id: "openjourney", name: "OpenJourney", icon: "fas fa-road" },
      { id: "sd21", name: "SD 2.1", icon: "fas fa-layer-group" },
      { id: "kandinsky", name: "Kandinsky", icon: "fas fa-palette" }
    ],
    premium: [
      { id: "midjourney", name: "Midjourney", icon: "fas fa-star" },
      { id: "dalle3", name: "DALL-E 3", icon: "fab fa-openai" },
      { id: "stablexl", name: "Stable XL", icon: "fas fa-rocket" },
      { id: "leonardo", name: "Leonardo", icon: "fas fa-chess-queen" }
    ],
    styles: [
      { id: "cyberpunk", name: "Cyberpunk", icon: "fas fa-city" },
      { id: "vaporwave", name: "Vaporwave", icon: "fas fa-sun" },
      { id: "pixel-art", name: "Pixel Art", icon: "fas fa-gamepad" },
      { id: "anime", name: "Anime", icon: "fas fa-user-ninja" },
      { id: "ghibli", name: "Ghibli", icon: "fas fa-dragon" },
      { id: "steampunk", name: "Steampunk", icon: "fas fa-cog" }
    ]
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function randChoice(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function drawRingText(ctx, text, cx, cy, r, font, color, rotate = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotate);
    ctx.font = font;
    ctx.fillStyle = color;
    const step = (Math.PI * 2) / text.length;
    for (let i = 0; i < text.length; i += 1) {
      ctx.save();
      ctx.rotate(i * step);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text[i], 0, -r);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStarPolygon(ctx, cx, cy, outer, inner, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (Math.PI * i) / points;
      const r = i % 2 === 0 ? outer : inner;
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
  }

  function drawPlatonic(ctx, cx, cy, r, sides, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawConstellation(ctx, rng, w, h, count, color) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: rng() * w,
        y: rng() * h,
        r: 1 + rng() * 2
      });
    }
    ctx.save();
    ctx.fillStyle = color;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawKamea(ctx, rng, cx, cy, size, grid, color) {
    const cell = size / grid;
    const numbers = Array.from({ length: grid * grid }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.font = `${Math.max(8, cell * 0.4)}px "Share Tech Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let r = 0; r < grid; r += 1) {
      for (let c = 0; c < grid; c += 1) {
        const x = cx - size / 2 + c * cell;
        const y = cy - size / 2 + r * cell;
        ctx.strokeRect(x, y, cell, cell);
        ctx.fillText(String(numbers[r * grid + c]), x + cell / 2, y + cell / 2);
      }
    }
    ctx.restore();
  }

  function drawTreeOfLife(ctx, cx, cy, size, color) {
    const nodes = [
      [-1, -2], [0, -2.4], [1, -2],
      [-1.6, -1], [0, -1], [1.6, -1],
      [-1, 0], [0, 0], [1, 0],
      [0, 1.3]
    ];
    const lines = [
      [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
      [3, 4], [4, 5], [3, 6], [4, 7], [5, 8],
      [6, 7], [7, 8], [7, 9], [6, 9], [8, 9]
    ];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.06;
    lines.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a][0], nodes[a][1]);
      ctx.lineTo(nodes[b][0], nodes[b][1]);
      ctx.stroke();
    });
    ctx.fillStyle = color;
    nodes.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 0.18, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSigil(ctx, rng, cx, cy, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = rng() * Math.PI * 2;
      const rr = r * (0.3 + rng() * 0.7);
      ctx.lineTo(cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr);
    }
    ctx.closePath();
    ctx.stroke();
    drawStarPolygon(ctx, cx, cy, r * 0.6, r * 0.3, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawIChing(ctx, rng, x, y, w, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const lineH = h / 6;
    for (let i = 0; i < 6; i += 1) {
      const yy = y + i * lineH + lineH * 0.35;
      const broken = rng() > 0.5;
      if (broken) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w * 0.42, yy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.58, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawOpenBook(ctx, cx, cy, w, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2);
    ctx.lineTo(cx, cy - h * 0.4);
    ctx.lineTo(cx + w / 2, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.lineTo(cx, cy + h * 0.4);
    ctx.lineTo(cx - w / 2, cy + h / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.4);
    ctx.lineTo(cx, cy + h * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawTerminal(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(0, 255, 128, 0.6)";
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(0, 255, 128, 0.8)";
    ctx.font = "12px 'Share Tech Mono', monospace";
    for (let i = 0; i < 8; i += 1) {
      ctx.fillText(`> ${Math.random().toString(16).slice(2, 10)}`, x + 8, y + 16 + i * 12);
    }
    ctx.restore();
  }

  function drawInkBlot(ctx, rng, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i += 1) {
      const angle = rng() * Math.PI * 2;
      const rr = r * (0.2 + rng() * 0.8);
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.cos(angle) * r * 0.6,
        cy + Math.sin(angle) * r * 0.6,
        rr,
        rr * 0.6,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function applyPixelate(ctx, canvas, size) {
    const w = canvas.width;
    const h = canvas.height;
    const tmp = document.createElement("canvas");
    tmp.width = Math.max(1, Math.floor(w / size));
    tmp.height = Math.max(1, Math.floor(h / size));
    const tctx = tmp.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0, w, h);
  }

  function applyBlur(ctx, canvas, amount) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.filter = `blur(${amount}px)`;
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.restore();
  }

  function applyPosterize(ctx, canvas, steps) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const step = 255 / steps;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(d[i] / step) * step;
      d[i + 1] = Math.round(d[i + 1] / step) * step;
      d[i + 2] = Math.round(d[i + 2] / step) * step;
    }
    ctx.putImageData(img, 0, 0);
  }

  function applyDither(ctx, canvas, amount) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const threshold = ((x + y) % 2) * amount * 255;
        const val = lum + threshold > 127 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function applyGlitch(ctx, canvas, rng, intensity) {
    const w = canvas.width;
    const h = canvas.height;
    for (let i = 0; i < 6; i += 1) {
      const sliceH = Math.max(1, Math.floor(rng() * h * 0.1));
      const y = Math.floor(rng() * h);
      const xOff = Math.floor((rng() - 0.5) * intensity * 60);
      const img = ctx.getImageData(0, y, w, sliceH);
      ctx.putImageData(img, xOff, y);
    }
  }

  function applyChromatic(ctx, canvas, offset) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const out = ctx.createImageData(w, h);
    const o = out.data;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        const rIdx = (y * w + clamp(x + offset, 0, w - 1)) * 4;
        const bIdx = (y * w + clamp(x - offset, 0, w - 1)) * 4;
        o[i] = d[rIdx];
        o[i + 1] = d[i + 1];
        o[i + 2] = d[bIdx + 2];
        o[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  function applyLensFlare(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    const x = rng() * w * 0.8 + w * 0.1;
    const y = rng() * h * 0.3 + h * 0.1;
    const g = ctx.createRadialGradient(x, y, 0, x, y, w * 0.6);
    g.addColorStop(0, "rgba(255,255,255,0.8)");
    g.addColorStop(0.2, "rgba(255,200,120,0.4)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function applyGravityWell(ctx, canvas, cx, cy, strength) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const out = ctx.createImageData(w, h);
    const o = out.data;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = clamp(strength / dist, 0, 1.2);
        const sx = Math.round(clamp(x - dx * pull, 0, w - 1));
        const sy = Math.round(clamp(y - dy * pull, 0, h - 1));
        const i = (y * w + x) * 4;
        const si = (sy * w + sx) * 4;
        o[i] = d[si];
        o[i + 1] = d[si + 1];
        o[i + 2] = d[si + 2];
        o[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  function applyTiltShift(ctx, canvas, focusY, blur) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(img, 0, 0);
    const top = focusY - h * 0.15;
    const bottom = focusY + h * 0.15;
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.rect(0, 0, w, top);
    ctx.rect(0, bottom, w, h - bottom);
    ctx.clip("evenodd");
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.restore();
  }

  function applyInkOutline(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const out = ctx.createImageData(w, h);
    const o = out.data;
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const i = (y * w + x) * 4;
        const gx = d[i - 4] - d[i + 4];
        const gy = d[i - w * 4] - d[i + w * 4];
        const g = Math.min(255, Math.abs(gx) + Math.abs(gy));
        const v = 255 - g;
        o[i] = v;
        o[i + 1] = v;
        o[i + 2] = v;
        o[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  function applyPencil(ctx, canvas) {
    applyInkOutline(ctx, canvas);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.6;
    ctx.drawImage(canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function applyCartoon(ctx, canvas, levels) {
    applyPosterize(ctx, canvas, levels);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    applyInkOutline(ctx, canvas);
    ctx.restore();
  }

  function applyMelt(ctx, canvas, rng, amount) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let x = 0; x < w; x += 1) {
      const offset = Math.floor(rng() * amount * h * 0.2);
      for (let y = h - 1; y >= 0; y -= 1) {
        const i = (y * w + x) * 4;
        const sy = clamp(y - offset, 0, h - 1);
        const si = (sy * w + x) * 4;
        d[i] = d[si];
        d[i + 1] = d[si + 1];
        d[i + 2] = d[si + 2];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function applyMirror(ctx, canvas, slices) {
    const w = canvas.width;
    const h = canvas.height;
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext("2d");
    t.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < slices; i += 1) {
      ctx.save();
      ctx.translate((w / slices) * i, 0);
      if (i % 2 === 1) {
        ctx.scale(-1, 1);
        ctx.drawImage(tmp, -w / slices, 0, w / slices, h, 0, 0, w / slices, h);
      } else {
        ctx.drawImage(tmp, i * (w / slices), 0, w / slices, h, 0, 0, w / slices, h);
      }
      ctx.restore();
    }
  }

  function applyReptile(ctx, canvas, tiles) {
    const w = canvas.width;
    const h = canvas.height;
    const tw = Math.floor(w / tiles);
    const th = Math.floor(h / tiles);
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext("2d");
    t.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < tiles; y += 1) {
      for (let x = 0; x < tiles; x += 1) {
        ctx.save();
        if ((x + y) % 2 === 1) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            tmp,
            x * tw,
            y * th,
            tw,
            th,
            -(x + 1) * tw,
            y * th,
            tw,
            th
          );
        } else {
          ctx.drawImage(tmp, x * tw, y * th, tw, th, x * tw, y * th, tw, th);
        }
        ctx.restore();
      }
    }
  }

  function applyOverworld(ctx, canvas, rng) {
    applyPixelate(ctx, canvas, 8);
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    for (let i = 0; i < 40; i += 1) {
      ctx.fillStyle = `hsla(${Math.floor(rng() * 360)},80%,60%,0.4)`;
      ctx.fillRect(rng() * canvas.width, rng() * canvas.height, 6 + rng() * 24, 6 + rng() * 24);
    }
    ctx.restore();
  }

  function applyTieDye(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 14; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 80 + rng() * 200;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${rng() * 360},90%,60%,0.6)`);
      g.addColorStop(1, "hsla(0,0%,0%,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function applyWaveform(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,255,0.6)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 8) {
        const y = h * (0.2 + i * 0.12) + Math.sin((x / w) * Math.PI * 4 + rng() * 6) * 20;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function applyClay(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.filter = "blur(1.5px) saturate(140%)";
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.restore();
  }

  function applySpikes(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 200; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng() - 0.5) * 80, y + (rng() - 0.5) * 80);
      ctx.stroke();
    }
    ctx.restore();
  }

  function applyNeon(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = "rgba(0,255,255,0.8)";
    ctx.shadowBlur = 20;
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.restore();
  }

  function applyAscii(ctx, canvas, charset, scale) {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${scale}px monospace`;
    ctx.fillStyle = "#00ff88";
    for (let y = 0; y < h; y += scale) {
      for (let x = 0; x < w; x += scale) {
        const i = (y * w + x) * 4;
        const lum = (img[i] + img[i + 1] + img[i + 2]) / 3;
        const idx = Math.floor((lum / 255) * (charset.length - 1));
        ctx.fillText(charset[idx], x, y);
      }
    }
  }

  function applyVcrTracking(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let i = 0; i < 12; i += 1) {
      ctx.fillRect(0, rng() * h, w, 2 + rng() * 4);
    }
    ctx.restore();
  }

  function applyBroadcast(ctx, canvas, rng) {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(${200 + rng() * 55},${200 + rng() * 55},${200 + rng() * 55},0.18)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function applyInkSplatter(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    for (let i = 0; i < 30; i += 1) {
      ctx.beginPath();
      ctx.arc(rng() * w, rng() * h, 4 + rng() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function applyCutout(ctx, canvas) {
    applyPosterize(ctx, canvas, 4);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.8;
    applyInkOutline(ctx, canvas);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function applyPixelWipe(ctx, canvas, rng) {
    const w = canvas.width;
    const h = canvas.height;
    const size = 16;
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        if (rng() > 0.5) {
          ctx.clearRect(x, y, size, size);
        }
      }
    }
  }

  function applyBookCover(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.strokeStyle = "rgba(255,215,0,0.6)";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    ctx.restore();
  }

  function applyLegacyOverlay(ctx, canvas, name, rng, intensity) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.globalAlpha = clamp(intensity, 0.2, 1);
    if (name.includes("Warp") || name.includes("Vortex") || name.includes("Tunnel")) {
      applyGravityWell(ctx, canvas, w / 2, h / 2, 80 + intensity * 120);
    } else if (name.includes("Neon") || name.includes("Cyberpunk")) {
      applyNeon(ctx, canvas);
      applyChromatic(ctx, canvas, 2 + Math.floor(intensity * 3));
    } else if (name.includes("Vaporwave") || name.includes("Duotone")) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,105,180,0.25)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,255,255,0.2)";
      ctx.fillRect(0, 0, w, h);
    } else if (name.includes("CRT") || name.includes("Scanline") || name.includes("VHS")) {
      applyVcrTracking(ctx, canvas, rng);
      applyBroadcast(ctx, canvas, rng);
    } else if (name.includes("Pixel") || name.includes("Gameboy")) {
      applyPixelate(ctx, canvas, 6);
      applyDither(ctx, canvas, 0.35);
    } else if (name.includes("Sketch") || name.includes("Charcoal")) {
      applyPencil(ctx, canvas);
    } else if (name.includes("Watercolor") || name.includes("Oil")) {
      applyBlur(ctx, canvas, 2 + intensity * 2);
      applyPosterize(ctx, canvas, 6);
    } else if (name.includes("Mirror") || name.includes("Kaleido")) {
      applyMirror(ctx, canvas, 6);
    } else if (name.includes("Sigil") || name.includes("Arcane")) {
      drawSigil(ctx, rng, w / 2, h / 2, Math.min(w, h) * 0.22, "rgba(255,255,255,0.8)");
    } else if (name.includes("DNA") || name.includes("Neuron")) {
      ctx.strokeStyle = "rgba(0,255,180,0.5)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 24; i += 1) {
        ctx.beginPath();
        ctx.moveTo(rng() * w, rng() * h);
        ctx.bezierCurveTo(rng() * w, rng() * h, rng() * w, rng() * h, rng() * w, rng() * h);
        ctx.stroke();
      }
    } else if (name.includes("Psychedelic") || name.includes("Acid")) {
      applyTieDye(ctx, canvas, rng);
    } else {
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = `hsla(${rng() * 360},80%,60%,0.2)`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  const EFFECTS = [
    {
      id: "transmutation",
      name: "Transmutation Circle",
      category: "Occult",
      params: { seed: 42, opacity: 0.7 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        drawStarPolygon(ctx, cx, cy, Math.min(w, h) * 0.18, Math.min(w, h) * 0.08, 6);
        ctx.stroke();
        drawRingText(ctx, HEBREW + GREEK, cx, cy, Math.min(w, h) * 0.28, "16px serif", "rgba(255,255,255,0.8)", rng());
        ctx.restore();
      }
    },
    {
      id: "kamea",
      name: "Kamea Grid",
      category: "Occult",
      params: { seed: 96, grid: 6, opacity: 0.7 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        const size = Math.min(canvas.width, canvas.height) * 0.6;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        drawKamea(ctx, rng, canvas.width / 2, canvas.height / 2, size, p.grid, "rgba(255,255,255,0.8)");
        ctx.restore();
      }
    },
    {
      id: "tree_of_life",
      name: "Tree of Life",
      category: "Occult",
      params: { size: 60, opacity: 0.8 },
      apply(ctx, canvas, p) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        drawTreeOfLife(ctx, canvas.width / 2, canvas.height / 2, p.size / 100, "rgba(255,255,255,0.9)");
        ctx.restore();
      }
    },
    {
      id: "sigil",
      name: "Sigil",
      category: "Occult",
      params: { seed: 33, opacity: 0.8 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        drawSigil(ctx, rng, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.2, "rgba(255,255,255,0.85)");
      }
    },
    {
      id: "tarot_stamp",
      name: "Tarot Stamp",
      category: "Occult",
      params: { seed: 77, opacity: 0.8 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        const card = randChoice(rng, TAROT);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "18px serif";
        ctx.textAlign = "center";
        ctx.fillText(card, canvas.width / 2, canvas.height * 0.85);
        ctx.restore();
      }
    },
    {
      id: "iching",
      name: "I Ching Hexagrams",
      category: "Occult",
      params: { seed: 12, opacity: 0.8 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        drawIChing(ctx, rng, canvas.width * 0.12, canvas.height * 0.2, canvas.width * 0.12, canvas.height * 0.4, "rgba(255,255,255,0.8)");
        drawIChing(ctx, rng, canvas.width * 0.76, canvas.height * 0.2, canvas.width * 0.12, canvas.height * 0.4, "rgba(255,255,255,0.8)");
        ctx.restore();
      }
    },
    {
      id: "platonic",
      name: "Platonic Solids",
      category: "Occult",
      params: { opacity: 0.7 },
      apply(ctx, canvas, p) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        drawPlatonic(ctx, cx, cy, Math.min(canvas.width, canvas.height) * 0.18, 4, "rgba(255,255,255,0.7)");
        drawPlatonic(ctx, cx, cy, Math.min(canvas.width, canvas.height) * 0.26, 5, "rgba(255,255,255,0.7)");
        drawPlatonic(ctx, cx, cy, Math.min(canvas.width, canvas.height) * 0.34, 6, "rgba(255,255,255,0.7)");
        ctx.restore();
      }
    },
    {
      id: "constellations",
      name: "Constellations",
      category: "Occult",
      params: { seed: 10, opacity: 0.7 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        drawConstellation(ctx, rng, canvas.width, canvas.height, 18, "rgba(255,255,255,0.7)");
        ctx.restore();
      }
    },
    {
      id: "tilt_shift",
      name: "Tilt Shift",
      category: "Blur",
      params: { focus: 0.5, blur: 6 },
      apply(ctx, canvas, p) {
        applyTiltShift(ctx, canvas, canvas.height * p.focus, p.blur);
      }
    },
    {
      id: "blur_soft",
      name: "Soft Blur",
      category: "Blur",
      params: { amount: 3 },
      apply(ctx, canvas, p) {
        applyBlur(ctx, canvas, p.amount);
      }
    },
    {
      id: "blur_heavy",
      name: "Heavy Blur",
      category: "Blur",
      params: { amount: 8 },
      apply(ctx, canvas, p) {
        applyBlur(ctx, canvas, p.amount);
      }
    },
    {
      id: "ink",
      name: "Ink Outline",
      category: "Style",
      params: {},
      apply(ctx, canvas) {
        applyInkOutline(ctx, canvas);
      }
    },
    {
      id: "pencil",
      name: "Pencil Sketch",
      category: "Style",
      params: {},
      apply(ctx, canvas) {
        applyPencil(ctx, canvas);
      }
    },
    {
      id: "cartoon",
      name: "Cartoon",
      category: "Style",
      params: { levels: 6 },
      apply(ctx, canvas, p) {
        applyCartoon(ctx, canvas, p.levels);
      }
    },
    {
      id: "melt",
      name: "Melt",
      category: "Style",
      params: { seed: 8, amount: 1 },
      apply(ctx, canvas, p) {
        applyMelt(ctx, canvas, seeded(p.seed), p.amount);
      }
    },
    {
      id: "lens_flare",
      name: "Lens Flare",
      category: "Style",
      params: { seed: 5 },
      apply(ctx, canvas, p) {
        applyLensFlare(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "gravity_well",
      name: "Gravity Well",
      category: "Style",
      params: { strength: 120 },
      apply(ctx, canvas, p) {
        applyGravityWell(ctx, canvas, canvas.width / 2, canvas.height / 2, p.strength);
      }
    },
    {
      id: "mirror_f",
      name: "Mirror F",
      category: "Mirror",
      params: { slices: 6 },
      apply(ctx, canvas, p) {
        applyMirror(ctx, canvas, p.slices);
      }
    },
    {
      id: "cutout",
      name: "Cutout",
      category: "Pixel",
      params: {},
      apply(ctx, canvas) {
        applyCutout(ctx, canvas);
      }
    },
    {
      id: "reptile",
      name: "Reptile",
      category: "Pixel",
      params: { tiles: 6 },
      apply(ctx, canvas, p) {
        applyReptile(ctx, canvas, p.tiles);
      }
    },
    {
      id: "overworld",
      name: "Pixel Overworld",
      category: "Pixel",
      params: { seed: 14 },
      apply(ctx, canvas, p) {
        applyOverworld(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "tie_dye",
      name: "Tie Dye",
      category: "Pixel",
      params: { seed: 22 },
      apply(ctx, canvas, p) {
        applyTieDye(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "waveform",
      name: "Waveform",
      category: "Overlay",
      params: { seed: 19 },
      apply(ctx, canvas, p) {
        applyWaveform(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "claymation",
      name: "Claymation",
      category: "Style",
      params: {},
      apply(ctx, canvas) {
        applyClay(ctx, canvas);
      }
    },
    {
      id: "spikes",
      name: "Spikes",
      category: "Overlay",
      params: { seed: 4 },
      apply(ctx, canvas, p) {
        applySpikes(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "neon",
      name: "Neon Glow",
      category: "Style",
      params: {},
      apply(ctx, canvas) {
        applyNeon(ctx, canvas);
      }
    },
    {
      id: "open_book",
      name: "Open Book",
      category: "Overlay",
      params: {},
      apply(ctx, canvas) {
        drawOpenBook(ctx, canvas.width / 2, canvas.height / 2, canvas.width * 0.6, canvas.height * 0.4, "rgba(255,255,255,0.7)");
      }
    },
    {
      id: "book_cover",
      name: "Book Cover",
      category: "Overlay",
      params: {},
      apply(ctx, canvas) {
        applyBookCover(ctx, canvas);
      }
    },
    {
      id: "terminal",
      name: "Terminal Screen",
      category: "Overlay",
      params: {},
      apply(ctx, canvas) {
        drawTerminal(ctx, canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.4);
      }
    },
    {
      id: "ascii",
      name: "ASCII Art",
      category: "ASCII",
      params: { scale: 8, charset: "@#W$9876543210?!abc;:+=-,._" },
      apply(ctx, canvas, p) {
        applyAscii(ctx, canvas, p.charset, Math.max(6, Math.floor(p.scale)));
      }
    },
    {
      id: "ink_blotches",
      name: "Ink Blotches",
      category: "Overlay",
      params: { seed: 77 },
      apply(ctx, canvas, p) {
        drawInkBlot(ctx, seeded(p.seed), canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.12, "rgba(0,0,0,0.5)");
        applyInkSplatter(ctx, canvas, seeded(p.seed + 1));
      }
    },
    {
      id: "glitch",
      name: "Glitch",
      category: "Glitch",
      params: { seed: 9, intensity: 0.8 },
      apply(ctx, canvas, p) {
        applyGlitch(ctx, canvas, seeded(p.seed), p.intensity);
      }
    },
    {
      id: "vcr_tracking",
      name: "VCR Tracking",
      category: "Glitch",
      params: { seed: 31 },
      apply(ctx, canvas, p) {
        applyVcrTracking(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "dither",
      name: "Dither",
      category: "Pixel",
      params: { amount: 0.4 },
      apply(ctx, canvas, p) {
        applyDither(ctx, canvas, p.amount);
      }
    },
    {
      id: "vcr_chromatic",
      name: "VCR Chromatic",
      category: "Glitch",
      params: { offset: 3 },
      apply(ctx, canvas, p) {
        applyChromatic(ctx, canvas, Math.floor(p.offset));
      }
    },
    {
      id: "broadcast",
      name: "Broadcast Colors",
      category: "Glitch",
      params: { seed: 63 },
      apply(ctx, canvas, p) {
        applyBroadcast(ctx, canvas, seeded(p.seed));
      }
    },
    {
      id: "pixel_wipe",
      name: "Cutout Repetile",
      category: "Pixel",
      params: { seed: 50 },
      apply(ctx, canvas, p) {
        applyPixelWipe(ctx, canvas, seeded(p.seed));
      }
    }
  ];
  const LEGACY_EFFECTS = Object.entries(LEGACY_EFFECT_CATEGORIES).flatMap(([category, names]) =>
    names.map((name) => ({
      id: `legacy_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      name,
      category,
      params: { seed: 1, intensity: 0.7 },
      apply(ctx, canvas, p) {
        const rng = seeded(p.seed);
        applyLegacyOverlay(ctx, canvas, name, rng, p.intensity);
      }
    }))
  );
  const ALL_EFFECTS = [...EFFECTS, ...LEGACY_EFFECTS];

  const EFFECT_MAP = Object.fromEntries(ALL_EFFECTS.map((e) => [e.id, e]));

  function applyEffectStack(ctx, canvas, stack) {
    stack.forEach((entry) => {
      const fx = EFFECT_MAP[entry.id] || entry;
      if (!fx || !fx.apply) return;
      fx.apply(ctx, canvas, entry.params || fx.params || {});
    });
  }

  function getLegacyEffects() {
    return LEGACY_EFFECT_CATEGORIES;
  }

  function buildLegacyEffectStack(category, count = 3, seed = Date.now()) {
    const rng = seeded(seed);
    const names = LEGACY_EFFECT_CATEGORIES[category] || [];
    const picks = [];
    while (picks.length < Math.min(count, names.length)) {
      const name = randChoice(rng, names);
      if (!picks.includes(name)) picks.push(name);
    }
    return picks.map((name) => ({
      id: `legacy_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      params: { seed: Math.floor(rng() * 9999), intensity: 0.7 }
    }));
  }

  return {
    BLEND_MODES,
    EFFECTS: ALL_EFFECTS,
    EFFECT_MAP,
    applyEffectStack,
    AI_PROVIDERS,
    LEGACY_EFFECT_CATEGORIES: getLegacyEffects(),
    buildLegacyEffectStack
  };
})();

window.HYPERFX = HYPERFX;

/* -----------------------
   HYPERFX v6.2 — FULL JS ENGINE
   Single-file engine for CodePen JS panel
----------------------- */
const HYPERFX_ENGINE = (() => {
  const CONFIG = { VERSION: "6.2" };

  const state = {
    currentMode: "still",
    currentSlot: "A",
    batchImages: {},
    sourceImage: null,
    maskImage: null,
    blendImage: null,
    blendOpacity: 0.55,
    blendMode: "screen",
    activeEffects: {},
    effectOrder: [],
    time: 0,
    lastFpsTime: 0,
    frameCount: 0,
    fps: 60,
    isProcessing: false,
    settings: {
      syncAll: true,
      enableGlow: true,
      audioDrive: true,
      fpsLimit: 60,
      exportQuality: 90
    }
  };

  ["A", "B", "C", "D", "E", "F"].forEach((l) => {
    state.batchImages[l] = null;
  });

  const audio = {
    enabled: false,
    ctx: null,
    analyser: null,
    data: null,
    rms: 0,
    bass: 0,
    treble: 0,
    stream: null
  };

  async function startMic() {
    if (audio.enabled) return;
    audio.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audio.ctx.createMediaStreamSource(audio.stream);
    audio.analyser = audio.ctx.createAnalyser();
    audio.analyser.fftSize = 1024;
    audio.data = new Uint8Array(audio.analyser.frequencyBinCount);
    src.connect(audio.analyser);
    audio.enabled = true;
    $("#micBtn").addClass("active");
  }

  function stopMic() {
    if (!audio.enabled) return;
    audio.stream.getTracks().forEach((t) => t.stop());
    audio.enabled = false;
    $("#micBtn").removeClass("active");
  }

  function tickAudio() {
    if (!audio.enabled) return;
    audio.analyser.getByteFrequencyData(audio.data);
    let sum = 0;
    for (let i = 0; i < audio.data.length; i += 1) {
      sum += audio.data[i] * audio.data[i];
    }
    audio.rms = Math.sqrt(sum / audio.data.length) / 255;
  }

  function drive(v, amt = 0.4) {
    if (!state.settings.audioDrive || !audio.enabled) return v;
    return v * (1 + audio.rms * amt);
  }

  const drawCanvas = document.getElementById("drawCanvas");
  const ctx = drawCanvas.getContext("2d", { willReadFrequently: true });

  function resize() {
    const r = drawCanvas.parentElement.getBoundingClientRect();
    drawCanvas.width = Math.floor(r.width);
    drawCanvas.height = Math.floor(r.height);
  }

  window.addEventListener("resize", resize);
  resize();

  function defScanlines() {
    return {
      id: "scanlines",
      name: "Scanlines",
      category: "Camera",
      params: { strength: 0.6, spacing: 3 },
      apply(ctx, c, p) {
        const { width: w, height: h } = c;
        ctx.save();
        ctx.globalAlpha = drive(p.strength);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        for (let y = 0; y < h; y += p.spacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.restore();
      }
    };
  }

  function defOpenShutter() {
    return {
      id: "shutter",
      name: "Open Shutter",
      category: "Camera",
      params: { persistence: 0.85 },
      apply(ctx, c, p) {
        if (!c._shutter) {
          c._shutter = document.createElement("canvas");
          c._shutter.width = c.width;
          c._shutter.height = c.height;
        }
        const t = c._shutter.getContext("2d");
        t.globalAlpha = p.persistence;
        t.drawImage(c, 0, 0);
        ctx.drawImage(c._shutter, 0, 0);
      }
    };
  }

  function defDoubleExposure() {
    return {
      id: "doubleexp",
      name: "Double Exposure",
      category: "Camera",
      params: { offset: 8, opacity: 0.4 },
      apply(ctx, c, p) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.drawImage(c, p.offset, p.offset);
        ctx.restore();
      }
    };
  }

  function defColorBleed() {
    return {
      id: "bleed",
      name: "Color Bleed",
      category: "Camera",
      params: { amount: 6 },
      apply(ctx, c, p) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(c, p.amount, 0);
        ctx.drawImage(c, -p.amount, 0);
        ctx.restore();
      }
    };
  }

  function defDataMosh() {
    return {
      id: "mosh",
      name: "Datamosh",
      category: "Glitch",
      params: { rows: 6, chance: 0.25 },
      apply(ctx, c, p) {
        const img = ctx.getImageData(0, 0, c.width, c.height);
        for (let y = 0; y < c.height; y += p.rows) {
          if (Math.random() < p.chance) {
            const off = (Math.random() * 20) | 0;
            img.data.copyWithin(
              y * c.width * 4,
              (y + off) * c.width * 4,
              (y + off + p.rows) * c.width * 4
            );
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    };
  }

  function defAscii() {
    return {
      id: "ascii_engine",
      name: "ASCII",
      category: "Pixel",
      params: { size: 8 },
      apply(ctx, c, p) {
        const chars = " .:-=+*#%@";
        const img = ctx.getImageData(0, 0, c.width, c.height).data;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.font = `${p.size}px monospace`;
        for (let y = 0; y < c.height; y += p.size) {
          for (let x = 0; x < c.width; x += p.size) {
            const i = ((y * c.width) + x) * 4;
            const v = (img[i] + img[i + 1] + img[i + 2]) / 3;
            const ch = chars[Math.floor((v / 255) * (chars.length - 1))];
            ctx.fillText(ch, x, y);
          }
        }
      }
    };
  }

  function defTransmutationCircle() {
    return {
      id: "circle",
      name: "Transmutation Circle",
      category: "Occult",
      params: { radius: 0.35, spin: 0.2 },
      apply(ctx, c, p) {
        const r = Math.min(c.width, c.height) * p.radius;
        const cx = c.width / 2;
        const cy = c.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(state.time * p.spin * 0.001);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 12; i += 1) {
          ctx.rotate(Math.PI / 6);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(r, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    };
  }

  const ENGINE_EFFECTS = [
    defScanlines(),
    defOpenShutter(),
    defDoubleExposure(),
    defColorBleed(),
    defDataMosh(),
    defAscii(),
    defTransmutationCircle()
  ];

  const ENGINE_EFFECT_MAP = Object.fromEntries(ENGINE_EFFECTS.map((e) => [e.id, e]));

  function render() {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    if (state.sourceImage) {
      ctx.drawImage(state.sourceImage, 0, 0, drawCanvas.width, drawCanvas.height);
    }
    for (const id of state.effectOrder) {
      const effect = state.activeEffects[id];
      if (effect && effect.enabled) {
        effect.def.apply(ctx, drawCanvas, effect.params);
      }
    }
  }

  function loop(ts) {
    state.time = ts;
    tickAudio();
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    CONFIG,
    state,
    audio,
    startMic,
    stopMic,
    tickAudio,
    drive,
    drawCanvas,
    ctx,
    resize,
    ENGINE_EFFECTS,
    ENGINE_EFFECT_MAP,
    render
  };
})();

window.HYPERFX_ENGINE = HYPERFX_ENGINE;
