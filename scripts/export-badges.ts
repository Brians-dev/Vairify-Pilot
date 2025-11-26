/**
 * Export Script: Export Badge Variants
 * 
 * Exports VAI badge designs as SVG files
 * Saves to /public/assets/badges/
 * 
 * Usage: npx tsx scripts/export-badges.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = ['sm', 'md', 'lg'];
const outputDir = join(process.cwd(), 'public', 'assets', 'badges');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

function generateBadgeSVG(size: 'sm' | 'md' | 'lg', showNumber: boolean = true): string {
  const sizeMap = {
    sm: { width: 120, height: 28, fontSize: 10, iconSize: 12 },
    md: { width: 180, height: 36, fontSize: 12, iconSize: 16 },
    lg: { width: 240, height: 48, fontSize: 14, iconSize: 20 }
  };

  const dims = sizeMap[size];
  const vaiNumber = showNumber ? '786TR89' : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${dims.width}" height="${dims.height}" viewBox="0 0 ${dims.width} ${dims.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Badge background -->
  <rect width="${dims.width}" height="${dims.height}" rx="6" fill="#2563EB" stroke="#1e40af" stroke-width="2"/>
  
  <!-- Shield icon -->
  <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" 
        fill="white" 
        transform="translate(${dims.iconSize / 2 + 4}, ${dims.height / 2 - dims.iconSize / 2}) scale(${dims.iconSize / 24})"/>
  
  <!-- V.A.I. VERIFIED text -->
  <text x="${dims.iconSize + 12}" y="${dims.height / 2 + dims.fontSize / 3}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${dims.fontSize}" 
        font-weight="600" 
        fill="white">
    V.A.I. VERIFIED
  </text>
  
  ${showNumber && vaiNumber ? `
  <!-- VAI Number -->
  <text x="${dims.width - 60}" y="${dims.height / 2 + dims.fontSize / 3}" 
        font-family="monospace" 
        font-size="${dims.fontSize - 2}" 
        fill="white">
    #${vaiNumber}
  </text>
  ` : ''}
  
  <!-- Checkmark icon -->
  <circle cx="${dims.width - dims.iconSize - 4}" cy="${dims.height / 2}" r="${dims.iconSize / 2}" fill="white" stroke="#1e40af" stroke-width="1.5"/>
  <path d="M${dims.width - dims.iconSize - 6} ${dims.height / 2}l2 2 4-4" 
        stroke="#1e40af" 
        stroke-width="1.5" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"/>
</svg>`;
}

function exportAllBadges() {
  console.log('🎨 Exporting badge variants...\n');

  for (const size of sizes) {
    try {
      // Badge with number
      const svgWithNumber = generateBadgeSVG(size, true);
      const filenameWithNumber = `vai-badge-${size}-with-number.svg`;
      const filepathWithNumber = join(outputDir, filenameWithNumber);
      writeFileSync(filepathWithNumber, svgWithNumber, 'utf-8');
      console.log(`  ✅ ${filenameWithNumber}`);

      // Badge without number
      const svgWithoutNumber = generateBadgeSVG(size, false);
      const filenameWithoutNumber = `vai-badge-${size}-no-number.svg`;
      const filepathWithoutNumber = join(outputDir, filenameWithoutNumber);
      writeFileSync(filepathWithoutNumber, svgWithoutNumber, 'utf-8');
      console.log(`  ✅ ${filenameWithoutNumber}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${size} badge:`, error);
    }
  }

  console.log(`\n✨ All badges exported to ${outputDir}`);
}

// Run the export
exportAllBadges();





