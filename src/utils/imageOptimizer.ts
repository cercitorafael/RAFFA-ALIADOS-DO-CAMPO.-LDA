/**
 * Image compressor utility to resize and optimize photos and logos uploaded by the user.
 * Reduces 5MB+ smartphone camera photos or high-res logos to lightweight format (~50KB-120KB),
 * preserving transparency for PNGs and preventing browser storage quota errors.
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
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        const isPng = file.type === 'image/png' || file.type === 'image/svg+xml';

        if (!isPng) {
          // Fill white background for JPEGs so transparent areas never render as black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        let outputDataUrl = '';
        if (isPng) {
          try {
            // Try WEBP with alpha first for best compression
            outputDataUrl = canvas.toDataURL('image/webp', quality);
            if (!outputDataUrl.startsWith('data:image/webp')) {
              outputDataUrl = canvas.toDataURL('image/png');
            }
          } catch {
            outputDataUrl = canvas.toDataURL('image/png');
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
