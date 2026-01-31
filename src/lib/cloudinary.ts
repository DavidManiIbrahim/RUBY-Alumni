
export const uploadToCloudinary = async (file: File | Blob) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    console.log('[Cloudinary] Starting upload...', { cloudName, uploadPreset });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        console.log('[Cloudinary] Hitting URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Cloudinary] Server Error:', errorData);
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        console.log('[Cloudinary] Upload Success:', data.secure_url);
        return {
            url: data.secure_url,
            public_id: data.public_id,
            error: null
        };
    } catch (error: any) {
        console.error('[Cloudinary] Fetch Error:', error);
        return {
            url: null,
            public_id: null,
            error: error
        };
    }
};

export const cloudinary = {
    upload: uploadToCloudinary
};

export default cloudinary;
