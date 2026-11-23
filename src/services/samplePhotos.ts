// Generates offline, high-fidelity SVG data URLs representing different cattle breeds and coats
export const samplePhotos = {
  holstein: (tag: string) => `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#86efac"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <ellipse cx="200" cy="270" rx="160" ry="25" fill="#15803d" opacity="0.4"/>
      <!-- Cow Body (White base with black patches) -->
      <ellipse cx="200" cy="160" rx="110" ry="70" fill="#f8fafc"/>
      <!-- Black Patches -->
      <path d="M 120 140 C 140 100, 180 110, 170 150 C 160 180, 130 180, 120 140 Z" fill="#0f172a"/>
      <path d="M 220 120 C 260 110, 280 150, 250 170 C 230 180, 210 150, 220 120 Z" fill="#0f172a"/>
      <ellipse cx="190" cy="180" rx="25" ry="15" fill="#0f172a"/>
      <!-- Legs -->
      <rect x="120" y="190" width="16" height="75" rx="6" fill="#f8fafc"/>
      <rect x="150" y="190" width="16" height="75" rx="6" fill="#0f172a"/>
      <rect x="230" y="190" width="16" height="75" rx="6" fill="#f8fafc"/>
      <rect x="260" y="190" width="16" height="75" rx="6" fill="#0f172a"/>
      <!-- Hooves -->
      <rect x="120" y="260" width="16" height="8" rx="2" fill="#334155"/>
      <rect x="150" y="260" width="16" height="8" rx="2" fill="#334155"/>
      <rect x="230" y="260" width="16" height="8" rx="2" fill="#334155"/>
      <rect x="260" y="260" width="16" height="8" rx="2" fill="#334155"/>
      <!-- Cow Head -->
      <polygon points="70,110 130,90 140,150 90,170" fill="#f8fafc"/>
      <path d="M 80 105 C 100 90, 120 100, 110 130 Z" fill="#0f172a"/>
      <!-- Ears & Horns -->
      <ellipse cx="130" cy="95" rx="18" ry="7" fill="#f8fafc" transform="rotate(-15 130 95)"/>
      <ellipse cx="65" cy="115" rx="14" ry="6" fill="#0f172a" transform="rotate(20 65 115)"/>
      <!-- Snout -->
      <ellipse cx="80" cy="165" rx="18" ry="12" fill="#fbcfe8"/>
      <circle cx="75" cy="165" r="3" fill="#831843"/>
      <circle cx="85" cy="165" r="3" fill="#831843"/>
      <!-- Eye -->
      <circle cx="105" cy="120" r="5" fill="#0f172a"/>
      <circle cx="106" cy="119" r="1.5" fill="#ffffff"/>
      <!-- Ear Tag Badge -->
      <polygon points="120,95 128,115 116,115" fill="#eab308"/>
      <text x="122" y="112" font-family="sans-serif" font-size="7" font-weight="bold" fill="#000" text-anchor="middle">${tag}</text>
      <!-- Title Overlay -->
      <rect x="10" y="10" width="150" height="26" rx="6" fill="#000000" opacity="0.6"/>
      <text x="20" y="27" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Holstein • ${tag}</text>
    </svg>
  `),

  brahman: (tag: string, color: 'white' | 'red' = 'white') => {
    const baseColor = color === 'white' ? '#e2e8f0' : '#b45309';
    const darkShade = color === 'white' ? '#94a3b8' : '#78350f';
    return `data:image/svg+xml;utf8,` + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#84cc16"/>
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#bg)"/>
        <ellipse cx="200" cy="270" rx="160" ry="25" fill="#4d7c0f" opacity="0.3"/>
        <!-- Prominent Zebu Hump (Giba) -->
        <ellipse cx="145" cy="100" rx="35" ry="32" fill="${baseColor}"/>
        <!-- Body -->
        <ellipse cx="210" cy="160" rx="115" ry="65" fill="${baseColor}"/>
        <!-- Dewlap (Papada prominente) -->
        <path d="M 90 160 C 100 210, 135 220, 150 180 Z" fill="${darkShade}" opacity="0.7"/>
        <!-- Legs -->
        <rect x="130" y="190" width="18" height="75" rx="5" fill="${baseColor}"/>
        <rect x="160" y="190" width="18" height="75" rx="5" fill="${darkShade}"/>
        <rect x="250" y="190" width="18" height="75" rx="5" fill="${baseColor}"/>
        <rect x="280" y="190" width="18" height="75" rx="5" fill="${darkShade}"/>
        <!-- Drooping Ears -->
        <ellipse cx="60" cy="150" rx="12" ry="26" fill="${baseColor}" transform="rotate(15 60 150)"/>
        <!-- Head -->
        <polygon points="65,115 120,110 115,165 75,175" fill="${baseColor}"/>
        <ellipse cx="65" cy="175" rx="15" ry="10" fill="${darkShade}"/>
        <!-- Horns -->
        <path d="M 85 108 C 80 80, 70 85, 75 105 Z" fill="#475569"/>
        <path d="M 105 105 C 110 78, 120 82, 115 103 Z" fill="#475569"/>
        <!-- Ear Tag -->
        <polygon points="65,130 73,148 60,148" fill="#eab308"/>
        <text x="66" y="145" font-family="sans-serif" font-size="6" font-weight="bold" fill="#000" text-anchor="middle">${tag}</text>
        <rect x="10" y="10" width="170" height="26" rx="6" fill="#000000" opacity="0.6"/>
        <text x="20" y="27" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Brahman ${color === 'white' ? 'Blanco' : 'Rojo'} • ${tag}</text>
      </svg>
    `);
  },

  angus: (tag: string) => `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#bbf7d0"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <ellipse cx="200" cy="270" rx="160" ry="25" fill="#14532d" opacity="0.4"/>
      <!-- Deep muscular Black Angus body -->
      <ellipse cx="205" cy="155" rx="120" ry="72" fill="#0f172a"/>
      <!-- Legs (thick muscular beef) -->
      <rect x="115" y="185" width="22" height="80" rx="6" fill="#0f172a"/>
      <rect x="150" y="185" width="20" height="80" rx="6" fill="#1e293b"/>
      <rect x="250" y="185" width="22" height="80" rx="6" fill="#0f172a"/>
      <rect x="285" y="185" width="20" height="80" rx="6" fill="#1e293b"/>
      <!-- Polled Head (Sin cuernos) -->
      <ellipse cx="85" cy="130" rx="35" ry="32" fill="#0f172a"/>
      <ellipse cx="60" cy="150" rx="18" ry="14" fill="#1e293b"/>
      <ellipse cx="95" cy="110" rx="14" ry="7" fill="#0f172a" transform="rotate(-25 95 110)"/>
      <!-- Eye -->
      <circle cx="78" cy="125" r="4" fill="#334155"/>
      <circle cx="79" cy="124" r="1.5" fill="#ffffff"/>
      <!-- Yellow Tag -->
      <polygon points="90,115 98,135 85,135" fill="#facc15"/>
      <text x="91" y="132" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="#000" text-anchor="middle">${tag}</text>
      <rect x="10" y="10" width="165" height="26" rx="6" fill="#000000" opacity="0.6"/>
      <text x="20" y="27" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Black Angus • ${tag}</text>
    </svg>
  `),

  jersey: (tag: string) => `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <ellipse cx="200" cy="270" rx="160" ry="25" fill="#0369a1" opacity="0.3"/>
      <!-- Fawn / Light Brown Jersey Body -->
      <ellipse cx="205" cy="155" rx="105" ry="60" fill="#d97706"/>
      <!-- Dark points / shadings -->
      <ellipse cx="140" cy="160" rx="30" ry="40" fill="#b45309" opacity="0.6"/>
      <!-- Slender Legs -->
      <rect x="125" y="185" width="15" height="80" rx="4" fill="#d97706"/>
      <rect x="150" y="185" width="15" height="80" rx="4" fill="#b45309"/>
      <rect x="245" y="185" width="15" height="80" rx="4" fill="#d97706"/>
      <rect x="270" y="185" width="15" height="80" rx="4" fill="#b45309"/>
      <!-- Head with wide deer-like eyes -->
      <polygon points="75,110 125,100 120,150 80,165" fill="#d97706"/>
      <!-- Dark Muzzle with white ring -->
      <ellipse cx="75" cy="162" rx="16" ry="12" fill="#ffffff"/>
      <ellipse cx="75" cy="162" rx="13" ry="9" fill="#1e293b"/>
      <!-- Large Eye -->
      <circle cx="95" cy="120" r="7" fill="#1e293b"/>
      <circle cx="97" cy="118" r="2" fill="#ffffff"/>
      <!-- Tag -->
      <polygon points="115,105 123,125 110,125" fill="#facc15"/>
      <text x="116" y="122" font-family="sans-serif" font-size="6" font-weight="bold" fill="#000" text-anchor="middle">${tag}</text>
      <rect x="10" y="10" width="155" height="26" rx="6" fill="#000000" opacity="0.6"/>
      <text x="20" y="27" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Jersey Pura • ${tag}</text>
    </svg>
  `)
};
