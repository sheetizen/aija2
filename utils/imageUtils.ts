
/**
 * Loads an image from a URL and returns an HTMLImageElement.
 * @param {string} src The URL of the image to load.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Required for canvas operations on images from different origins
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

/**
 * Applies a black and white mask to an original image to make the background transparent.
 * @param {string} originalImageUrl URL of the original image.
 * @param {string} maskImageUrl URL of the black and white mask image.
 * @returns {Promise<string | null>} A promise that resolves with a base64 data URL of the resulting transparent image, or null on error.
 */
export const applyMaskToImage = async (originalImageUrl: string, maskImageUrl: string): Promise<string | null> => {
    try {
        const [originalImg, maskImg] = await Promise.all([
            loadImage(originalImageUrl),
            loadImage(maskImageUrl),
        ]);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        const width = originalImg.naturalWidth;
        const height = originalImg.naturalHeight;
        canvas.width = width;
        canvas.height = height;

        // Draw the mask first to read its pixel data
        ctx.drawImage(maskImg, 0, 0, width, height);
        const maskData = ctx.getImageData(0, 0, width, height);

        // Clear canvas and draw the original image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(originalImg, 0, 0, width, height);
        const originalData = ctx.getImageData(0, 0, width, height);

        const finalImageData = ctx.createImageData(width, height);

        // Iterate over each pixel
        for (let i = 0; i < maskData.data.length; i += 4) {
            // Check the red channel of the mask. If it's close to black (0), make it transparent.
            const isBackground = maskData.data[i] < 128;

            finalImageData.data[i] = originalData.data[i];       // R
            finalImageData.data[i + 1] = originalData.data[i + 1]; // G
            finalImageData.data[i + 2] = originalData.data[i + 2]; // B
            finalImageData.data[i + 3] = isBackground ? 0 : 255; // Alpha
        }

        ctx.putImageData(finalImageData, 0, 0);

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error applying mask to image:', error);
        return null;
    }
};
