import { GoogleGenAI, Modality, Type } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a blank, transparent canvas of a specific aspect ratio.
 * @param aspectRatio A string like "16:9" or "1:1".
 * @returns A base64 encoded string of the PNG image, without the data URL prefix.
 */
const createBlankCanvas = (aspectRatio: string): string => {
    const [width, height] = aspectRatio.split(':').map(Number);
    // Use a small base size to keep the base64 string short but maintain ratio
    const canvas = document.createElement('canvas');
    canvas.width = width * 100;
    canvas.height = height * 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Return only the base64 data part of the data URL
    return canvas.toDataURL('image/png').split(',')[1];
};

const fileToGenerativePart = async (file: File | Blob, mimeType?: string) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Or handle ArrayBuffer case
      }
    };
    reader.readAsDataURL(file);
  });
  
  const finalMimeType = mimeType || (file instanceof File ? file.type : 'image/png');

  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: finalMimeType },
  };
};

const processApiResponse = (response: any) => {
    let editedImageBase64: string | null = null;
    let responseText: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // FORCE the mimeType to image/png. The model might return image/jpeg
          // by default, which doesn't support transparency and causes a white background.
          // By telling the browser it's a PNG, it will correctly render the alpha channel.
          editedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) {
          responseText = part.text;
        }
      }
    }
    
    if(!editedImageBase64 && !responseText) {
        responseText = "No content was generated. The request may have been blocked.";
    }

    return { image: editedImageBase64, text: responseText };
}

export const editImage = async (imageFile: File, prompt: string): Promise<{ image: string | null; text: string | null }> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    return processApiResponse(response);

  } catch (error) {
    console.error("Error editing image:", error);
    let message = "An unexpected error occurred while communicating with the AI.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};

export const editImageWithMask = async (imageFile: File, maskBlob: Blob, prompt: string): Promise<{ image: string | null; text: string | null }> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const maskPart = await fileToGenerativePart(maskBlob, 'image/png');
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, maskPart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    return processApiResponse(response);

  } catch (error) {
    console.error("Error editing image with mask:", error);
    let message = "An unexpected error occurred while communicating with the AI.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};

export const getCreativeIdeas = async (imageFile: File): Promise<string[] | null> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { text: "You are a creative photo editing assistant. Analyze the following image and provide 3-4 distinct, creative ideas for how to edit it. Each idea should be a short, actionable sentence that can be used as a prompt for an AI image editor. Return the ideas as a JSON array of strings." },
            imagePart
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
      },
    });

    const jsonString = response.text;
    if (jsonString) {
        const result = JSON.parse(jsonString);
        return result.ideas || null;
    }
    return null;

  } catch (error) {
    console.error("Error getting creative ideas:", error);
    let message = "An unexpected error occurred while generating ideas.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};

export const generateImages = async (prompt: string, numberOfImages: number, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string[]> => {
  try {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: numberOfImages,
        outputMimeType: 'image/png', // Use PNG to support transparency if needed and for better quality
        aspectRatio: aspectRatio,
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("The AI did not generate any images. This might be due to the safety policy.");
    }
    
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);

  } catch (error) {
    console.error("Error generating images:", error);
    let message = "An unexpected error occurred while generating images.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};

export const generateImageWithReference = async (files: File[], prompt: string, aspectRatio: string): Promise<string[]> => {
  try {
    if (!files || files.length === 0) {
      throw new Error("Please provide at least one reference image.");
    }
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    // Create a blank canvas with the target aspect ratio to guide the AI
    const blankCanvasBase64 = createBlankCanvas(aspectRatio);
    const canvasPart = {
      inlineData: {
        data: blankCanvasBase64,
        mimeType: 'image/png',
      },
    };

    const imageParts = await Promise.all(files.map(file => fileToGenerativePart(file)));
    
    // Updated prompt to explicitly instruct the AI to use the canvas as a frame
    const fullPrompt = `Please fill the provided blank transparent canvas with a new image. Use the other reference images as strong inspiration for the style, mood, and subject matter. Follow this specific instruction for the content: "${prompt}". The final output must be a single, complete image that perfectly fits the dimensions of the initial blank canvas.`;
    const textPart = { text: fullPrompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        // Send the canvas first to establish the output frame
        parts: [canvasPart, ...imageParts, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    const result = processApiResponse(response);
    
    if (result.image) {
        return [result.image];
    } else {
        throw new Error(result.text || "The AI could not generate an image from your request.");
    }

  } catch (error) {
    console.error("Error generating image with reference:", error);
    let message = "An unexpected error occurred while generating the image.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};

export const generatePromptIdeas = async (
  formData: { productName: string; productPosition: string; additionalInfo: string },
  referenceImages: File[]
): Promise<string[]> => {
  try {
    const { productName, productPosition, additionalInfo } = formData;
    const hasTextData = productName || productPosition || additionalInfo;

    if (!hasTextData && referenceImages.length === 0) {
      throw new Error("Please provide some information or a reference image to generate ideas.");
    }

    let textPrompt: string;

    if (referenceImages.length > 0 && !hasTextData) {
      // "With Reference" mode without form data
      textPrompt = `
        You are an expert prompt writer for an AI image generator.
        Analyze the following image(s) closely. Based *only* on the visual information (style, subject, composition, lighting, colors), generate 4 distinct, creative, and detailed prompt ideas in English.
        The prompts should describe how to create a similar or inspired image.
        Return the ideas as a JSON object with a single key "ideas" which is an array of 4 strings.
      `;
    } else {
      // "No Reference" mode with form data
      textPrompt = `
        You are an expert prompt writer for an AI image generator, specializing in stunning product photography for small businesses (UMKM).
        Based on the following information, generate 4 distinct, creative, and detailed prompt ideas.
        The prompts should be in English.

        Product Name: "${productName}"
        Product Position/Action: "${productPosition}"
        Additional Details (style, background, mood, colors): "${additionalInfo}"

        Return the ideas as a JSON object with a single key "ideas" which is an array of 4 strings.
      `;
    }

    const textPart = { text: textPrompt };
    const imageParts = await Promise.all(referenceImages.map(file => fileToGenerativePart(file)));
    
    const contents = {
        parts: [textPart, ...imageParts]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 4 distinct and creative prompt ideas for product photography."
            }
          }
        },
      },
    });

    const jsonString = response.text;
    if (jsonString) {
      const result = JSON.parse(jsonString);
      if (result.ideas && Array.isArray(result.ideas) && result.ideas.length > 0) {
        return result.ideas;
      }
    }
    throw new Error("The AI did not return valid prompt ideas. Please try again.");

  } catch (error) {
    console.error("Error generating prompt ideas:", error);
    let message = "An unexpected error occurred while generating ideas.";
    if (error instanceof Error) {
        message = error.message;
    }
    throw new Error(message);
  }
};