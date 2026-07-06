/**
 * Comprime uma imagem no lado do cliente utilizando Canvas.
 * Redimensiona a imagem para ter no máximo `maxWidth` de largura e exporta em formato JPEG
 * com a qualidade especificada.
 * 
 * @param file O arquivo de imagem selecionado pelo usuário
 * @param maxWidth Largura máxima da imagem (padrão 800px)
 * @param quality Qualidade do JPEG (padrão 0.7)
 * @returns Promise resolvendo com a string Base64 Data URL da imagem comprimida
 */
export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto 2D do Canvas.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
