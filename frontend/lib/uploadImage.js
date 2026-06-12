import api from './api';

/**
 * Upload a File to Cloudinary via the backend.
 * @param {File} file
 * @param {'avatars'|'posts'|'messages'|'knorvex'} folder
 * @returns {Promise<{ url: string, isImage: boolean, originalName: string, mimeType: string }>}
 */
export async function uploadFile(file, folder = 'knorvex') {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post(`/upload?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

/** Convenience wrapper — returns just the URL (used by avatar/post uploads). */
export async function uploadImage(file, folder = 'knorvex') {
  const result = await uploadFile(file, folder);
  return result.url;
}
