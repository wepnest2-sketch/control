const CLOUD_NAME = 'dlwuxgvse';
const API_KEY = '589557557863559';
const API_SECRET = '-qknr_5WoXpjEBGCLaN74UrgufQ';

async function sha1(str: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Transformation to reduce quality and size
  const transformation = 'c_limit,q_60,w_1000'; // Alphabetical order for signature

  // Sort params for signature: timestamp, transformation
  // Params must be sorted alphabetically by key
  // timestamp vs transformation: timestamp comes first alphabetically? No, t-i vs t-r.
  // timestamp vs transformation: 'ti' vs 'tr'. 'timestamp' comes first.
  const paramsToSign = `timestamp=${timestamp}&transformation=${transformation}`;
  const stringToSign = `${paramsToSign}${API_SECRET}`;
  const signature = await sha1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('transformation', transformation);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}
