import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { ThemeName, getThemeById, getThemeHexColor } from '@/lib/theme-colors';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandedQRCodeProps {
  data: string;
  themeId: ThemeName;
  size?: number;
  showDownload?: boolean;
  className?: string;
}

/**
 * BrandedQRCode Component
 * Creates a themed QR code that matches the selected theme colors
 */
export const BrandedQRCode: React.FC<BrandedQRCodeProps> = ({
  data,
  themeId,
  size = 300,
  showDownload = true,
  className = ''
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!qrRef.current) return;

    const theme = getThemeById(themeId);
    const primaryHex = getThemeHexColor(themeId, 'primary');
    const accentHex = getThemeHexColor(themeId, 'accent');

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: data,
      margin: 20,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'M'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 0
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

    qr.append(qrRef.current);
    setQrCode(qr);

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }
    };
  }, [data, themeId, size]);

  const handleDownloadPNG = async () => {
    if (!qrCode) return;
    setIsDownloading(true);
    try {
      await qrCode.download({ name: `vairify-qr-${themeId}`, extension: 'png' });
    } catch (error) {
      console.error('Error downloading PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSVG = async () => {
    if (!qrCode) return;
    setIsDownloading(true);
    try {
      await qrCode.download({ name: `vairify-qr-${themeId}`, extension: 'svg' });
    } catch (error) {
      console.error('Error downloading SVG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        ref={qrRef}
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={`QR code for ${data}`}
      />
      {showDownload && qrCode && (
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            variant="outline"
            size="sm"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            PNG
          </Button>
          <Button
            onClick={handleDownloadSVG}
            disabled={isDownloading}
            variant="outline"
            size="sm"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            SVG
          </Button>
        </div>
      )}
    </div>
  );
};





