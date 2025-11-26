/**
 * Export Script: Export Logo Variants
 * 
 * Exports VairifyLogo component as SVG files
 * Saves to /public/assets/logos/
 * 
 * Usage: npx tsx scripts/export-logos.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [24, 48, 96, 192, 512];
const outputDir = join(process.cwd(), 'public', 'assets', 'logos');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

function generateLogoSVG(size: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Double-checkmark design - two overlapping checkmarks -->
  <!-- First checkmark - navy outline -->
  <path
    d="M6 11L9.5 14.5L18 6"
    stroke="#1e40af"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <!-- Second checkmark - navy outline (slightly offset) -->
  <path
    d="M5 10L8.5 13.5L17 5"
    stroke="#1e40af"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <!-- First checkmark - white fill -->
  <path
    d="M6 11L9.5 14.5L18 6"
    stroke="white"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <!-- Second checkmark - white fill -->
  <path
    d="M5 10L8.5 13.5L17 5"
    stroke="white"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
    opacity="0.9"
  />
</svg>`;
}

function exportAllLogos() {
  console.log('🎨 Exporting logo variants...\n');

  for (const size of sizes) {
    try {
      const svg = generateLogoSVG(size);
      const filename = `vairify-logo-${size}px.svg`;
      const filepath = join(outputDir, filename);

      writeFileSync(filepath, svg, 'utf-8');
      console.log(`  ✅ ${filename}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${size}px logo:`, error);
    }
  }

  console.log(`\n✨ All logos exported to ${outputDir}`);
}

// Run the export
exportAllLogos();





