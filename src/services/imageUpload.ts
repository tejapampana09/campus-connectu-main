export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  // Validation
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Must be an image file' };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'Image too large (max 5MB)' };
  }

  // Current: return data URL (URL-based system still works)
  const dataUrl = URL.createObjectURL(file);

  // Future: integrate Firebase Storage here
  // Example:
  // import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  // import { storage } from '@/lib/firebase';
  //
  // const timestamp = Date.now();
  // const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  // const storageRef = ref(storage, `images/${userId}/${timestamp}-${sanitizedName}`);
  //
  // try {
  //   const snapshot = await uploadBytes(storageRef, file);
  //   const url = await getDownloadURL(snapshot.ref);
  //   return { success: true, url };
  // } catch (error) {
  //   return { success: false, error: 'Upload failed' };
  // }

  return { success: true, url: dataUrl };
};

export const validateImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
  } catch {
    return false;
  }
};
