
export const uploadToCloudinary = async (file: File | Blob) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            public_id: data.public_id,
            error: null
        };
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
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
