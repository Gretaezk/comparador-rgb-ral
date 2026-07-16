window.__appLoaded = true;

function clamp(value) {
  return Math.min(255, Math.max(0, value));
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map((value) => clamp(value).toString(16).padStart(2, '0'))
    .join('');
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = parseInt(full, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToXyz(r, g, b) {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const linear = (channel) => {
    if (channel <= 0.04045) {
      return channel / 12.92;
    }
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  const R = linear(sr);
  const G = linear(sg);
  const B = linear(sb);

  return {
    X: R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    Y: R * 0.2126729 + G * 0.7151522 + B * 0.0721750,
    Z: R * 0.0193339 + G * 0.1191920 + B * 0.9503041,
  };
}

function xyzToLab(x, y, z) {
  const refX = 95.047;
  const refY = 100;
  const refZ = 108.883;

  const pivot = (value) => {
    const delta = 6 / 29;
    if (value > Math.pow(delta, 3)) {
      return Math.cbrt(value);
    }
    return value / (Math.pow(delta, 3) * 3) + 4 / 29;
  };

  const fx = pivot(x / refX);
  const fy = pivot(y / refY);
  const fz = pivot(z / refZ);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function rgbToLab(r, g, b) {
  const xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.X, xyz.Y, xyz.Z);
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function deltaE2000(color1, color2) {
  const { L: L1, a: a1, b: b1 } = color1;
  const { L: L2, a: a2, b: b2 } = color2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cmean = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cmean, 7) / (Math.pow(Cmean, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const h1p = Math.atan2(b1, a1p);
  const h2p = Math.atan2(b2, a2p);
  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  const deltaHp = (() => {
    const diff = h2p - h1p;
    if (Math.abs(diff) > Math.PI) {
      return diff > 0 ? diff - 2 * Math.PI : diff + 2 * Math.PI;
    }
    return diff;
  })();
  const meanHp = (() => {
    const absDiff = Math.abs(h1p - h2p);
    if (absDiff > Math.PI) {
      return (h1p + h2p + 2 * Math.PI) / 2;
    }
    return (h1p + h2p) / 2;
  })();
  const T = 1
    - 0.17 * Math.cos(meanHp - degToRad(30))
    + 0.24 * Math.cos(2 * meanHp)
    + 0.32 * Math.cos(3 * meanHp + degToRad(6))
    - 0.20 * Math.cos(4 * meanHp - degToRad(63));
  const deltaTheta = 30 * Math.exp(-(((meanHp - degToRad(275)) / degToRad(25)) ** 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cmean, 7) / (Math.pow(Cmean, 7) + Math.pow(25, 7)));
  const SL = 1 + ((0.015 * (L1 + L2 - 200)) ** 2) / (20 + (L1 + L2 - 200) ** 2);
  const SC = 1 + 0.045 * Cmean;
  const SH = 1 + 0.015 * Cmean * T;
  const RT = -Math.sin(2 * deltaTheta) * Rc;

  return Math.sqrt(
    (deltaLp / SL) ** 2
    + (deltaCp / SC) ** 2
    + (deltaHp / SH) ** 2
    + RT * (deltaCp / SC) * (deltaHp / SH)
  );
}

const ralTable = [
  { name: 'RAL 9010', rgb: '#f0f0f0' },
  { name: 'RAL 9003', rgb: '#e5e1d0' },
  { name: 'RAL 9001', rgb: '#efefef' },
  { name: 'RAL 7035', rgb: '#8a8a8a' },
  { name: 'RAL 7016', rgb: '#3e3a38' },
  { name: 'RAL 7024', rgb: '#4a4d4a' },
  { name: 'RAL 7042', rgb: '#8d948d' },
  { name: 'RAL 7037', rgb: '#7d7f7d' },
  { name: 'RAL 6024', rgb: '#7a8f2a' },
  { name: 'RAL 6018', rgb: '#8dbb4f' },
  { name: 'RAL 6028', rgb: '#4f6a2d' },
  { name: 'RAL 6032', rgb: '#4c6f3d' },
  { name: 'RAL 5015', rgb: '#2b5d8c' },
  { name: 'RAL 5002', rgb: '#1f4e79' },
  { name: 'RAL 5005', rgb: '#0d4a7c' },
  { name: 'RAL 5024', rgb: '#0e5e86' },
  { name: 'RAL 5021', rgb: '#0c4b63' },
  { name: 'RAL 5010', rgb: '#0d4761' },
  { name: 'RAL 5012', rgb: '#1f4a7d' },
  { name: 'RAL 5017', rgb: '#2f4f6f' },
  { name: 'RAL 5022', rgb: '#1c355e' },
  { name: 'RAL 5023', rgb: '#3a5f8f' },
  { name: 'RAL 5000', rgb: '#003f6c' },
  { name: 'RAL 5001', rgb: '#005a8c' },
  { name: 'RAL 5003', rgb: '#1e4d7b' },
  { name: 'RAL 5004', rgb: '#0c5b7c' },
  { name: 'RAL 5007', rgb: '#2b5b7a' },
  { name: 'RAL 5026', rgb: '#0f2f4b' },
  { name: 'RAL 3003', rgb: '#8e3b3b' },
  { name: 'RAL 3020', rgb: '#b22d2d' },
  { name: 'RAL 3011', rgb: '#a1232b' },
  { name: 'RAL 3012', rgb: '#b85b3e' },
  { name: 'RAL 3009', rgb: '#a33c2d' },
  { name: 'RAL 8002', rgb: '#8c2d2f' },
  { name: 'RAL 8004', rgb: '#7a2618' },
  { name: 'RAL 2004', rgb: '#c83e2b' },
  { name: 'RAL 1021', rgb: '#d6a224' },
  { name: 'RAL 1033', rgb: '#d8b15d' },
  { name: 'RAL 1015', rgb: '#d8c7a0' },
  { name: 'RAL 1003', rgb: '#f4d13f' },
  { name: 'RAL 1014', rgb: '#e1c16b' },
  { name: 'RAL 1004', rgb: '#e2b007' },
  { name: 'RAL 4008', rgb: '#6a2c91' },
  { name: 'RAL 4010', rgb: '#5e2a7f' },
  { name: 'RAL 8017', rgb: '#6b2d2d' },
  { name: 'RAL 9004', rgb: '#a6a6a6' },
  { name: 'RAL 9005', rgb: '#0c0c0c' },
];

const preparedTable = ralTable.map((item) => {
  const rgb = hexToRgb(item.rgb);
  return { ...item, lab: rgbToLab(rgb.r, rgb.g, rgb.b) };
});

function compareWithRal(inputRgb) {
  const inputLab = rgbToLab(inputRgb.r, inputRgb.g, inputRgb.b);
  const scored = preparedTable.map((item) => ({
    ...item,
    deltaE: deltaE2000(inputLab, item.lab),
  }));
  scored.sort((a, b) => a.deltaE - b.deltaE);
  return scored.slice(0, 3);
}

document.addEventListener('DOMContentLoaded', () => {
  const hexInput = document.getElementById('hex');
  const redInput = document.getElementById('red');
  const greenInput = document.getElementById('green');
  const blueInput = document.getElementById('blue');
  const applyButton = document.getElementById('applyButton');
  const errorBox = document.getElementById('errorBox');
  const previewSwatch = document.getElementById('previewSwatch');
  const previewValue = document.getElementById('previewValue');
  const previewRgb = document.getElementById('previewRgb');
  const resultsList = document.getElementById('resultsList');
  const secondaryList = document.getElementById('secondaryList');
  const highestMatchName = document.getElementById('highestMatchName');
  const highestMatchDelta = document.getElementById('highestMatchDelta');
  const highestMatchBadge = document.getElementById('highestMatchBadge');

  function validateAndGetValues() {
    const inputs = [redInput, greenInput, blueInput];
    const parsed = [];

    for (const input of inputs) {
      const raw = input.value.trim();
      if (raw === '') {
        throw new Error(`El campo ${input.id.toUpperCase()} no puede estar vacío.`);
      }

      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
        throw new Error(`El campo ${input.id.toUpperCase()} debe ser un número entero válido.`);
      }

      if (numeric < 0 || numeric > 255) {
        throw new Error(`El campo ${input.id.toUpperCase()} debe estar entre 0 y 255.`);
      }

      parsed.push(numeric);
    }

    return { r: parsed[0], g: parsed[1], b: parsed[2] };
  }

  function parseHexValue(rawValue) {
    const trimmed = String(rawValue || '').trim();
    if (!trimmed) {
      throw new Error('Introduce un valor hexadecimal válido.');
    }

    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!/^#[0-9a-f]{3,8}$/i.test(normalized)) {
      throw new Error('El valor hex debe ser como #00385C.');
    }

    return hexToRgb(normalized);
  }

  function syncRgbInputs(rgb) {
    redInput.value = String(rgb.r);
    greenInput.value = String(rgb.g);
    blueInput.value = String(rgb.b);
    hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
  }

  function renderResults(rgb) {
    const colorHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const matches = compareWithRal(rgb);
    const [best, second, third] = matches;
    const exact = best.deltaE < 0.5;

    previewSwatch.style.backgroundColor = colorHex;
    previewValue.textContent = colorHex.toUpperCase();
    previewRgb.textContent = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    previewRgb.setAttribute('title', `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    hexInput.value = colorHex.toUpperCase();
    document.body.style.backgroundColor = colorHex;

    highestMatchName.textContent = best.name;
    highestMatchDelta.textContent = `${best.deltaE.toFixed(2)} ΔE00`;
    highestMatchBadge.textContent = exact ? 'Coincidencia exacta' : 'Aproximación';
    highestMatchBadge.className = `result-badge ${exact ? 'exact' : 'approx'}`;

    resultsList.innerHTML = '';
    const primary = document.createElement('div');
    primary.className = 'result-card best';
    primary.innerHTML = `
      <div class="result-meta">
        <div class="result-name">${best.name}</div>
        <div class="result-rgb">${best.rgb.toUpperCase()}</div>
      </div>
      <div class="result-color-chip" style="background:${best.rgb};"></div>
      <div class="result-delta">${best.deltaE.toFixed(2)} ΔE00</div>
      <div class="result-badge ${exact ? 'exact' : 'approx'}">${exact ? 'Exacta' : 'Aprox.'}</div>
    `;
    resultsList.appendChild(primary);

    secondaryList.innerHTML = '';
    [second, third].forEach((item) => {
      const row = document.createElement('div');
      row.className = 'secondary-item';
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div class="result-rgb">${item.rgb.toUpperCase()}</div>
        </div>
        <div class="secondary-right">
          <div class="result-color-chip" style="background:${item.rgb};"></div>
          <div class="result-delta">${item.deltaE.toFixed(2)} ΔE00</div>
        </div>
      `;
      secondaryList.appendChild(row);
    });
  }

  function applyColor(event) {
    errorBox.textContent = '';

    if (event?.target?.id === 'hex') {
      const raw = hexInput.value.trim();
      if (!raw) {
        return;
      }

      try {
        const rgb = parseHexValue(raw);
        syncRgbInputs(rgb);
        renderResults(rgb);
      } catch (error) {
        errorBox.textContent = error.message;
      }
      return;
    }

    try {
      const rgb = validateAndGetValues();
      syncRgbInputs(rgb);
      renderResults(rgb);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  }

  [hexInput, redInput, greenInput, blueInput].forEach((input) => {
    input.addEventListener('input', applyColor);
    input.addEventListener('change', applyColor);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyColor(event);
      }
    });
  });

  applyButton.addEventListener('click', applyColor);
  applyColor();
});
