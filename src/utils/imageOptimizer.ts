/**
 * Image compressor utility to resize and optimize photos and logos uploaded by the user.
 * Preserves exact original aspect ratio, keeps SVGs intact as vectors, and preserves
 * alpha transparency for PNG/WEBP/GIF files.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Preserve SVG files directly without canvas rasterization so vector shape never distorts
      if (file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
          resolve(dataUrl);
          return;
        }

        // Scale proportionally without ever changing aspect ratio
        const ratio = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
        const width = Math.max(1, Math.round(naturalWidth * ratio));
        const height = Math.max(1, Math.round(naturalHeight * ratio));

        // If already within bounds and lightweight (< 800KB), keep original untouched
        if (ratio === 1 && file.size <= 800 * 1024) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const hasAlphaSupport =
          file.type === 'image/png' ||
          file.type === 'image/webp' ||
          file.type === 'image/gif' ||
          file.type === 'image/avif';

        if (!hasAlphaSupport) {
          // Fill white background only for opaque formats (like JPEG)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.clearRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        let outputDataUrl = '';
        if (hasAlphaSupport) {
          try {
            outputDataUrl = canvas.toDataURL('image/png');
          } catch {
            outputDataUrl = dataUrl;
          }
        } else {
          try {
            outputDataUrl = canvas.toDataURL('image/webp', quality);
            if (!outputDataUrl.startsWith('data:image/webp')) {
              outputDataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch {
            outputDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        }

        resolve(outputDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
