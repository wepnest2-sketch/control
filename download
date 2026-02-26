const CLOUD_NAME = 'dlwuxgvse';
const API_KEY = '589557557863559';
const API_SECRET = '-qknr_5WoXpjEBGCLaN74UrgufQ';

export async function uploadImage(file: File): Promise<string> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Signed upload requires signature of all parameters except file, api_key, resource_type, etc.
  // We only use timestamp here.
  const signatureParams = `timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signatureParams);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  // Cloudinary automatically optimizes quality with q_auto if we request it in the URL, 
  // but for upload we can just upload the original. 
  // To "not tire the database", we store the URL. 
  // We can also force incoming transformation if needed, but standard upload is fine.
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

async function sha1(str: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');
}
