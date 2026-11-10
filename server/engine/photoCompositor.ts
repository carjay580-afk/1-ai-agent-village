function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface GeneratedPhotoResult {
  svgDataUrl: string;
  palette: string[];
  aspectRatio: string;
  styleLabel: string;
}

export function composePhotoSvg(
  prompt: string,
  style = 'Northern Aurora Cinema',
  aspectRatio = '16:9',
  overlayTitle?: string
): GeneratedPhotoResult {
  const seed = hashStr(prompt + style);
  const p = (prompt + ' ' + style).toLowerCase();

  let width = 1280;
  let height = 720;
  if (aspectRatio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '2.39:1') {
    width = 1440;
    height = 602;
  }

  // Select atmospheric palette from prompt & style
  let palette = ['#060B19', '#0F2942', '#10B981', '#38BDF8', '#F59E0B'];
  if (/sunset|golden|warm|autumn|maple|desert|amber|campfire/.test(p)) {
    palette = ['#180B1A', '#4A192C', '#EA580C', '#F59E0B', '#FDE68A'];
  } else if (/cyber|neon|city|toronto|tokyo|future|sci-fi|synth/.test(p)) {
    palette = ['#07071A', '#1B1045', '#EC4899', '#06B6D4', '#A855F7'];
  } else if (/ocean|sea|harbor|maritime|whale|atlantic|pacific|rain/.test(p)) {
    palette = ['#04121F', '#0C3559', '#0284C7', '#38BDF8', '#E0F2FE'];
  } else if (/forest|algonquin|woods|cedar|emerald|nature|garden/.test(p)) {
    palette = ['#061512', '#11382B', '#10B981', '#34D399', '#FEF3C7'];
  }

  const isCity = /city|skyline|tower|toronto|vancouver|montreal|street|cyber|neon|building/.test(p);
  const isSpace = /space|planet|cosmos|galaxy|astronaut|starship|moon|orbit|sci-fi/.test(p);
  const isCabin = /cabin|lodge|house|village|home|campfire|cozy|sanctuary/.test(p);

  // Stars
  const stars: string[] = [];
  for (let i = 0; i < 65; i++) {
    const sx = ((seed * (i + 13) * 37) % width);
    const sy = ((seed * (i + 7) * 53) % Math.floor(height * 0.58));
    const r = ((i % 3) + 1) * 0.75;
    const op = (0.25 + ((i * 19) % 70) / 100).toFixed(2);
    stars.push(`<circle cx="${sx}" cy="${sy}" r="${r}" fill="#FFFFFF" opacity="${op}" />`);
  }

  // Aurora / Nebula ribbons
  const auroraPaths: string[] = [];
  for (let a = 0; a < 3; a++) {
    const y0 = height * (0.16 + a * 0.08);
    const c1y = y0 - 90 + ((seed >>> a) % 80);
    const c2y = y0 + 95 - ((seed >>> (a + 2)) % 75);
    const color = a % 2 === 0 ? palette[2] : palette[3];
    auroraPaths.push(
      `<path d="M -50 ${y0} C ${width * 0.3} ${c1y}, ${width * 0.68} ${c2y}, ${width + 50} ${y0 - 30}" fill="none" stroke="${color}" stroke-width="${55 - a * 10}" stroke-linecap="round" opacity="${0.22 - a * 0.04}" filter="url(#glow)" />`
    );
  }

  // Horizon geometry (City skyline OR Space Planet/Rings OR Alpine Mountain Range)
  let horizonMarkup = '';
  const horizonY = Math.floor(height * 0.66);

  if (isCity) {
    const buildings: string[] = [];
    const count = 26;
    const colW = width / count;
    for (let b = 0; b < count; b++) {
      const bh = 70 + ((seed * (b + 5) * 29) % Math.floor(height * 0.36));
      const bx = b * colW - 4;
      const by = horizonY - bh;
      buildings.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(colW + 6).toFixed(1)}" height="${bh}" fill="#090F1E" stroke="${palette[3]}" stroke-opacity="0.22" />`);
      // Spire on flagship tower
      if (b === Math.floor(count * 0.58)) {
        buildings.push(`<line x1="${(bx + colW / 2).toFixed(1)}" y1="${by - 75}" x2="${(bx + colW / 2).toFixed(1)}" y2="${by}" stroke="${palette[4]}" stroke-width="4" />`);
        buildings.push(`<ellipse cx="${(bx + colW / 2).toFixed(1)}" cy="${by - 28}" rx="18" ry="6" fill="${palette[3]}" opacity="0.85" />`);
      }
      // Windows
      for (let wy = by + 12; wy < horizonY - 12; wy += 16) {
        if ((b + wy) % 3 !== 0) {
          buildings.push(`<rect x="${(bx + 8).toFixed(1)}" y="${wy}" width="${Math.max(6, colW - 16).toFixed(1)}" height="4" fill="${(b + wy) % 2 === 0 ? palette[4] : palette[3]}" opacity="0.45" />`);
        }
      }
    }
    horizonMarkup = buildings.join('\n');
  } else if (isSpace) {
    const px = width * 0.68;
    const py = height * 0.36;
    const pr = Math.min(width, height) * 0.19;
    horizonMarkup = `
      <ellipse cx="${px}" cy="${py}" rx="${pr * 1.9}" ry="${pr * 0.42}" fill="none" stroke="${palette[3]}" stroke-width="10" opacity="0.45" transform="rotate(-18 ${px} ${py})" />
      <circle cx="${px}" cy="${py}" r="${pr}" fill="url(#planetGrad)" />
      <path d="M 0 ${horizonY} Q ${width * 0.32} ${horizonY - 90} ${width * 0.62} ${horizonY - 25} T ${width} ${horizonY - 55} L ${width} ${height} L 0 ${height} Z" fill="#080D1A" />
    `;
  } else {
    // Majestic Canadian Rocky / Laurentian mountains + pine silhouettes
    const m1: string[] = [`M 0 ${horizonY}`];
    const m2: string[] = [`M 0 ${horizonY + 22}`];
    const segs = 9;
    for (let s = 1; s <= segs; s++) {
      const mx = (width / segs) * s;
      const my1 = horizonY - 90 - ((seed * s * 41) % Math.floor(height * 0.25));
      const my2 = horizonY - 40 - ((seed * (s + 3) * 23) % Math.floor(height * 0.16));
      m1.push(`L ${(mx - width / (segs * 2)).toFixed(1)} ${my1.toFixed(1)} L ${mx.toFixed(1)} ${(horizonY - 25).toFixed(1)}`);
      m2.push(`L ${(mx - width / (segs * 2)).toFixed(1)} ${my2.toFixed(1)} L ${mx.toFixed(1)} ${(horizonY + 18).toFixed(1)}`);
    }
    m1.push(`L ${width} ${height} L 0 ${height} Z`);
    m2.push(`L ${width} ${height} L 0 ${height} Z`);
    horizonMarkup = `
      <path d="${m1.join(' ')}" fill="${palette[1]}" opacity="0.88" />
      <path d="${m2.join(' ')}" fill="#08111F" />
    `;
  }

  // Pine treeline + optional cozy cedar dome/cabin
  const pines: string[] = [];
  for (let t = 0; t < 34; t++) {
    const tx = (width / 33) * t;
    const th = 26 + ((seed + t * 17) % 38);
    const ty = horizonY + 8;
    pines.push(
      `<polygon points="${tx.toFixed(1)},${(ty - th).toFixed(1)} ${(tx - th * 0.34).toFixed(1)},${ty} ${(tx + th * 0.34).toFixed(1)},${ty}" fill="#040913" />`
    );
  }

  const cabinMarkup = isCabin || !isCity
    ? `
      <g transform="translate(${(width * 0.22).toFixed(1)}, ${(horizonY - 26).toFixed(1)})">
        <path d="M 0 32 Q 44 -22 88 32 Z" fill="#162235" stroke="${palette[4]}" stroke-width="1.5" />
        <rect x="26" y="12" width="36" height="20" rx="4" fill="${palette[4]}" opacity="0.9" filter="url(#glow)" />
      </g>
    `
    : '';

  const sunOrbX = (width * (0.28 + ((seed % 44) / 100))).toFixed(1);
  const sunOrbY = (height * 0.28).toFixed(1);

  const labelTitle = overlayTitle || prompt.slice(0, 54);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette[0]}" />
      <stop offset="58%" stop-color="${palette[1]}" />
      <stop offset="100%" stop-color="${palette[2]}" stop-opacity="0.55" />
    </linearGradient>
    <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette[1]}" />
      <stop offset="45%" stop-color="${palette[0]}" />
      <stop offset="100%" stop-color="#03060D" />
    </linearGradient>
    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette[4]}" stop-opacity="0.9" />
      <stop offset="40%" stop-color="${palette[2]}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${palette[0]}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="planetGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette[3]}" />
      <stop offset="65%" stop-color="${palette[1]}" />
      <stop offset="100%" stop-color="#040711" />
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#skyGrad)" />
  <circle cx="${sunOrbX}" cy="${sunOrbY}" r="${Math.min(width, height) * 0.28}" fill="url(#orbGlow)" />
  ${stars.join('\n  ')}
  ${auroraPaths.join('\n  ')}
  ${horizonMarkup}
  ${pines.join('\n  ')}
  ${cabinMarkup}

  <!-- Reflective Northern Lake Foreground -->
  <rect x="0" y="${horizonY + 8}" width="${width}" height="${height - horizonY}" fill="url(#lakeGrad)" opacity="0.94" />
  <ellipse cx="${sunOrbX}" cy="${horizonY + (height - horizonY) * 0.42}" rx="${width * 0.22}" ry="${(height - horizonY) * 0.26}" fill="${palette[2]}" opacity="0.18" filter="url(#glow)" />

  <!-- Subtle Water Ripples -->
  <g stroke="${palette[3]}" stroke-opacity="0.24" stroke-width="1.5">
    <line x1="${width * 0.18}" y1="${horizonY + 34}" x2="${width * 0.48}" y2="${horizonY + 34}" />
    <line x1="${width * 0.35}" y1="${horizonY + 66}" x2="${width * 0.76}" y2="${horizonY + 66}" />
    <line x1="${width * 0.24}" y1="${horizonY + 104}" x2="${width * 0.64}" y2="${horizonY + 104}" />
  </g>

  <!-- Subtle Studio Signature Badge -->
  <g transform="translate(28, ${height - 54})">
    <rect width="380" height="34" rx="8" fill="#050914" fill-opacity="0.66" stroke="#FFFFFF" stroke-opacity="0.12" />
    <text x="14" y="22" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">
      ${escapeXml(labelTitle.length > 44 ? labelTitle.slice(0, 44) + '...' : labelTitle)}
    </text>
  </g>
</svg>`;

  return {
    svgDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
    palette,
    aspectRatio,
    styleLabel: style,
  };
}
