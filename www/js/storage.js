// BabyTrack Mobile — Compresor de Imágenes Ligero para Gama Baja y Lector de PDFs
window.BabyStorage = (() => {
  async function compressImageFile(file, maxDim = 1080, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen no válida'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const approxBytes = Math.round((dataUrl.length * 3) / 4);
          resolve({
            originalFilename: file.name || 'imagen.jpg',
            mimeType: 'image/jpeg',
            fileCategory: 'IMAGE',
            fileSizeBytes: approxBytes,
            dataUrl
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function processAttachmentFile(file) {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) {
      return await compressImageFile(file);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el documento'));
      reader.onload = (e) => {
        resolve({
          originalFilename: file.name || 'documento.pdf',
          mimeType: file.type || 'application/pdf',
          fileCategory: (file.type || '').includes('pdf') ? 'PDF' : 'IMAGE',
          fileSizeBytes: file.size || 0,
          dataUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return {
    compressImageFile,
    processAttachmentFile,
    formatBytes
  };
})();
