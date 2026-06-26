// Distinct, accessible palette (tweak as needed)
export const PALETTE = [
    "#6C5CE7", "#00B894", "#0984E3", "#E17055", "#E84393",
    "#2ECC71", "#E67E22", "#1ABC9C", "#9B59B6", "#3498DB",
    "#F1C40F", "#E74C3C", "#16A085", "#8E44AD", "#2C3E50"
];

export function nextLabelColor(used: Set<string>): string {
    // 1) Try first unused in palette
    for (const c of PALETTE) if (!used.has(c)) return c;
    // 2) If exhausted, generate new distinct color by rotating hue
    const i = used.size - PALETTE.length + 1;
    const golden = 0.61803398875;
    const hue = Math.floor(((i * golden) % 1) * 360);
    return hslToHex(hue, 65, 50);
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Pick readable text color for the chip
export function textOn(bgHex: string): "#000000" | "#FFFFFF" {
    const { r, g, b } = hexToRgb(bgHex);
    const L = relativeLuminance(r, g, b);
    // Contrast with white and black
    const contrastWhite = (1.05) / (L + 0.05);
    const contrastBlack = (L + 0.05) / 0.05;
    return contrastWhite >= contrastBlack ? "#FFFFFF" : "#000000";
}

function hexToRgb(hex: string) {
    const n = parseInt(hex.replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(r: number, g: number, b: number) {
    const srgb = [r, g, b].map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
