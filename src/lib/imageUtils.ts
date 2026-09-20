import { api } from './axios';

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 800; // max dimension

        if (width > height) {
          if (width > max) {
            height = Math.round(height * max / width);
            width = max;
          }
        } else {
          if (height > max) {
            width = Math.round(width * max / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Upload image file to Supabase Storage via backend API endpoint.
 * Returns public Supabase URL or falls back to local data URL on failure.
 */
export const uploadImageToStorage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('cover', file);
    formData.append('image', file);

    const response = await api.post('/api/v1/books/upload-cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const url = response.data?.data?.cover_image || response.data?.data?.url || response.data?.data?.image_url;
    if (url) {
      return url;
    }
  } catch (error) {
    console.warn('Backend Supabase storage upload failed, falling back to compressed local image:', error);
  }

  return compressImage(file);
};

