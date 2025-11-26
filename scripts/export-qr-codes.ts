/**
 * Export Script: Generate Branded QR Codes
 * 
 * Generates QR codes for all 8 themes at multiple sizes
 * Saves to /public/assets/qr-codes/
 * 
 * Usage: npx tsx scripts/export-qr-codes.ts
 */

import QRCodeStyling from 'qr-code-styling';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ThemeName, themes, getThemeHexColor } from '../src/lib/theme-colors';

const sizes = [300, 600, 1200];
const testData = 'vairify://verify/786TR89';
const outputDir = join(process.cwd(), 'public', 'assets', 'qr-codes');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

async function generateQRCode(
  themeId: ThemeName,
  size: number,
  data: string
): Promise<Buffer> {
  const primaryHex = getThemeHexColor(themeId, 'primary');
  const accentHex = getThemeHexColor(themeId, 'accent');

  const qr = new QRCodeStyling({
    width: size,
    height: size,
    type: 'png',
    data: data,
    margin: 20,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: 'M'
    },
    dotsOptions: {
      color: primaryHex,
      type: 'rounded'
    },
    backgroundOptions: {
      color: '#ffffff'
    },
    cornersSquareOptions: {
      color: accentHex,
      type: 'extra-rounded'
    },
    cornersDotOptions: {
      color: accentHex,
      type: 'dot'
    }
  });

  const blob = await qr.getRawData('png');
  if (!blob) {
    throw new Error(`Failed to generate QR code for ${themeId} at size ${size}`);
  }

  return Buffer.from(await blob.arrayBuffer());
}

async function exportAllQRCodes() {
  console.log('🎨 Generating branded QR codes...\n');

  const themeNames = Object.keys(themes) as ThemeName[];

  for (const themeId of themeNames) {
    console.log(`📱 Generating QR codes for ${themeId} theme...`);

    for (const size of sizes) {
      try {
        const buffer = await generateQRCode(themeId, size, testData);
        const filename = `qr-${themeId}-${size}px.png`;
        const filepath = join(outputDir, filename);

        writeFileSync(filepath, buffer);
        console.log(`  ✅ ${filename}`);
      } catch (error) {
        console.error(`  ❌ Failed to generate ${themeId} ${size}px:`, error);
      }
    }
  }

  console.log(`\n✨ All QR codes exported to ${outputDir}`);
}

// Run the export
exportAllQRCodes().catch(console.error);





