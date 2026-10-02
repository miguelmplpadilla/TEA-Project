import {Platform} from 'react-native';

const cloudinaryCloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

function isRemoteUrl(uri: string) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isDataUri(uri: string) {
  return uri.startsWith('data:image/');
}

function getFileName(uri: string, fallbackName: string) {
  const uriName = uri.split('/').pop();
  return uriName && uriName.includes('.') ? uriName : `${fallbackName}.jpg`;
}

function getMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

export async function uploadImageToCloudinary(uri: string, fallbackName: string) {
  if (isRemoteUrl(uri)) {
    return uri;
  }

  if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
    throw new Error('Falta configurar Cloudinary en .env.');
  }

  const fileName = getFileName(uri, fallbackName);
  const formData = new FormData();

  if (isDataUri(uri)) {
    formData.append('file', uri);
  } else if (Platform.OS === 'web') {
    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();

    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri,
      name: fileName,
      type: getMimeType(fileName),
    } as unknown as Blob);
  }

  formData.append('upload_preset', cloudinaryUploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );
  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url) {
    throw new Error(`Cloudinary (${response.status}): ${data.error?.message ?? 'subida rechazada.'}`);
  }

  return data.secure_url;
}

export async function uploadOptionalImageToCloudinary(
  uri: string | null | undefined,
  fallbackName: string,
) {
  if (!uri) {
    return null;
  }

  return uploadImageToCloudinary(uri, fallbackName);
}
