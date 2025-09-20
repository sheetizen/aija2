import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Tool } from '../types';
import { CanvasEditor, CanvasEditorRef } from './CanvasEditor';
import { getCreativeIdeas } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';

interface EditorProps {
  tools: Tool[];
  originalImage: File | null;
  editedImageUrl: string | null;
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  activeTool: Tool | null;
  onApplyEdit: (prompt: string, imageBlob: File | Blob, maskBlob?: Blob | null) => void;
  onToolSelect: (tool: Tool) => void;
  onClear: () => void;
}

const presets = [
    { id: 'golden-hour', name: 'Golden Hour', prompt: "Apply a 'Golden Hour' effect. Shift the overall color temperature to be much warmer, emphasizing yellows and soft oranges in the highlights and midtones. Slightly lift and warm the shadows to prevent harsh blacks. Add a subtle, gentle bloom effect to light sources, but do not wash out the image. The goal is a warm, cinematic glow, not overexposure." },
    { id: 'vintage-film', name: 'Vintage Film', prompt: "Emulate a 'Vintage Film' look. Slightly desaturate the colors overall. Introduce a fine, realistic film grain. Apply a subtle color shift: tint the shadows slightly green or blue, and the highlights slightly yellow or cream. Crush the blacks slightly for that faded, analog feel." },
    { id: 'cinematic-teal-orange', name: 'Cinematic', prompt: "Apply a classic 'Teal and Orange' cinematic color grade. Precisely shift the hue of colors in the shadows and cooler midtones towards teal/cyan. At the same time, shift the highlights, and especially skin tones, towards warm orange hues. Increase the overall color contrast and saturation slightly to make the color separation pop, creating a modern, dramatic movie look." },
    { id: 'moody-desaturated', name: 'Moody', prompt: "Create a moody and atmospheric look by significantly desaturating the colors, leaving only a hint of the original hues. Deepen the shadows and slightly crush the blacks to increase drama. Add a subtle cool, blue or green tint to the overall image. The final result should feel cinematic and melancholic, not just grayscale." },
    { id: 'bright-airy', name: 'Bright & Airy', prompt: "Create a bright, clean, and airy aesthetic. Gently lift the shadows to reveal detail and slightly increase the brightness of the midtones. Maintain highlight detail, avoiding pure white clipping. Reduce overall contrast for a soft feel and shift the color palette slightly towards lighter, pastel tones with a clean white balance." },
    { id: 'high-contrast-bw', name: 'High-Contrast B&W', prompt: "Convert the image to a powerful high-contrast black and white. Ensure deep, rich blacks and bright, clean whites while preserving midtone detail. Apply a moderate amount of sharpening and clarity to make the details and textures pop. Add a fine amount of film grain for a classic, gritty feel." },
    { id: 'neon-noir', name: 'Neon Noir', prompt: "Create a 'Neon Noir' or 'Cyberpunk' aesthetic. Crush the blacks and shift the shadows to a deep, cool blue or purple tint. Isolate light sources, reflections, and highlights, and intensify their colors into vibrant, glowing neons (like electric pink, cyan, and lime green). Increase the saturation of these specific neon colors while keeping the deep shadows desaturated. The final result should have high contrast between dark, cool shadows and bright, saturated neon lights." },
    { id: 'sepia-tone', name: 'Sepia', prompt: "Apply a classic sepia tone. First, convert the image to monochrome, then apply a warm, brownish tint consistently across all tones. Adjust the contrast to give it a nostalgic, antique photograph feel, ensuring the blacks aren't completely washed out." },
    { id: 'pastel-dream', name: 'Pastel Dream', prompt: "Apply a 'Pastel Dream' color grade. Shift the entire color palette towards soft, desaturated pastel tones. For example, turn vibrant reds into soft pinks, blues into baby blue, and greens into mint. Crucially, preserve the original exposure and avoid blowing out the highlights. The goal is a color shift, not a brightness change. Add a very subtle softness, but maintain detail." },
    { id: 'dramatic-lighting', name: 'Dramatic', prompt: "Dramatically enhance the lighting to create a chiaroscuro effect. Deepen the shadows significantly and boost the highlights to create strong directional light, similar to Rembrandt lighting. Increase overall contrast and clarity to make the subject's details pop, while letting the background fall into shadow." },
    { id: 'infrared-look', name: 'Infrared', prompt: "Simulate a surreal infrared photography effect. Convert green foliage and vegetation into shades of white or very light pink. At the same time, significantly darken blue skies to appear almost black. Maintain the tones of other elements like buildings or skin as naturally as possible to create a stark, otherworldly contrast." }
];

const ImageDisplay: React.FC<{
  displayUrl: string | null;
  onImageUpload: (file: File) => void;
}> = ({ displayUrl, onImageUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageUpload(event.target.files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-2xl aspect-square rounded-lg relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
           
            {displayUrl ? (
                <img src={displayUrl} alt="Image preview" className="w-full h-full rounded-lg object-contain" />
            ) : (
                <div 
                    onClick={handleClick}
                    className="text-center p-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full h-full flex flex-col items-center justify-center rounded-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-black dark:text-white">Click to upload a photo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG or WEBP</p>
                </div>
            )}
        </div>
    );
};

const PasPhotoEditor: React.FC<{
  clothing: string;
  setClothing: (c: string) => void;
  background: string;
  setBackground: (b: string) => void;
}> = ({ clothing, setClothing, background, setBackground }) => {
  const clothingOptions = ['Suit', 'Blazer', 'Shirt'];
  const backgroundOptions = [
    { name: 'Red', color: 'bg-red-500' },
    { name: 'Blue', color: 'bg-blue-500' },
    { name: 'White', color: 'bg-white' },
  ];

  return (
    <div className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Professional Outfit</label>
        <div className="grid grid-cols-3 gap-2">
          {clothingOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setClothing(option)}
              className={`px-4 py-2 text-sm rounded-md transition-colors text-center ${clothing === option ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background</label>
        <div className="flex space-x-4 items-center">
          {backgroundOptions.map(option => (
            <button
              key={option.name}
              type="button"
              onClick={() => setBackground(option.name)}
              className={`w-10 h-10 rounded-full transition-all duration-200 ${option.color} ${option.name === 'White' ? 'border-2 border-gray-300' : ''} ${background === option.name ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : 'hover:scale-110'}`}
              aria-label={`Select ${option.name} background`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}


export const Editor: React.FC<EditorProps> = ({ 
  tools,
  originalImage, 
  editedImageUrl, 
  onImageUpload, 
  isLoading, 
  error,
  activeTool,
  onApplyEdit,
  onToolSelect,
  onClear
}) => {
  const [prompt, setPrompt] = useState('');
  // Pas Photo State
  const [clothing, setClothing] = useState('Suit');
  const [background, setBackground] = useState('Red');
  // Canvas Edit State
  const [brushSize, setBrushSize] = useState(20);
  const canvasEditorRef = useRef<CanvasEditorRef>(null);
  // Expand State
  const [expandAspectRatio, setExpandAspectRatio] = useState('16:9');
  // Creative Ideas State
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);
  const [creativeIdeas, setCreativeIdeas] = useState<string[] | null>(null);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  // Preset State
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  // Before/After State
  const [isPeeking, setIsPeeking] = useState(false);


  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeTool) {
      setPrompt('');
      setCreativeIdeas(null);
      setIdeasError(null);
      setApplyingPresetId(null);
    }
  }, [activeTool]);

  useEffect(() => {
    canvasEditorRef.current?.clearMask();
  }, [activeTool, originalImage]);
  
  useEffect(() => {
    if (originalImage) {
        const url = URL.createObjectURL(originalImage);
        setOriginalImageUrl(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setOriginalImageUrl(null);
    }
  }, [originalImage]);
  
   useEffect(() => {
    if (!isLoading) {
      setApplyingPresetId(null);
    }
  }, [isLoading]);

  const handleFetchIdeas = async () => {
    if (!originalImage) return;
    setIsFetchingIdeas(true);
    setIdeasError(null);
    setCreativeIdeas(null);
    try {
      const ideas = await getCreativeIdeas(originalImage);
      setCreativeIdeas(ideas);
    } catch (e) {
      setIdeasError(e instanceof Error ? e.message : "Could not fetch ideas.");
    } finally {
      setIsFetchingIdeas(false);
    }
  };

  const handleIdeaClick = (idea: string) => {
    if (!originalImage) return;
    onApplyEdit(idea, originalImage, null);
    setCreativeIdeas(null);
  }

  const createImageFromCanvas = (image: HTMLImageElement, aspectRatio: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const [width, height] = aspectRatio.split(':').map(Number);
      const targetRatio = width / height;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const { naturalWidth: iw, naturalHeight: ih } = image;
      const imageRatio = iw / ih;

      let canvasWidth = iw;
      let canvasHeight = ih;

      if (targetRatio > imageRatio) {
        // Wider than original
        canvasWidth = ih * targetRatio;
        canvasHeight = ih;
      } else {
        // Taller than original
        canvasWidth = iw;
        canvasHeight = iw / targetRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw the original image in the center of the new canvas
      const x = (canvasWidth - iw) / 2;
      const y = (canvasHeight - ih) / 2;
      ctx.drawImage(image, x, y);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalImage || !activeTool) return;

    if (activeTool.id === 'ideas') {
      handleFetchIdeas();
      return;
    }
     // Presets have no form to submit, they are clicked directly
    if (activeTool.id === 'presets') {
      return;
    }

    let finalPrompt = prompt;
    let maskBlob: Blob | null = null;
    let imageBlob: Blob | File = originalImage;
    
    if (activeTool.id === 'pas-photo') {
      const clothingEn = clothing.toLowerCase();
      const backgroundEn = background.toLowerCase();
      finalPrompt = `Convert this into a professional passport photo. The person should be wearing a formal ${clothingEn}. The background should be a solid ${backgroundEn} color.`;
    } else if (activeTool.id === 'custom' || activeTool.id === 'magic-eraser') {
        maskBlob = await canvasEditorRef.current?.getMaskAsBlob() || null;
        if (activeTool.id === 'magic-eraser') {
            finalPrompt = activeTool.prompt; // Use the fixed prompt
        }
    } else if (activeTool.id === 'expand') {
      const img = new Image();
      img.src = URL.createObjectURL(originalImage);
      await new Promise(resolve => img.onload = resolve);

      const expandedCanvasBlob = await createImageFromCanvas(img, expandAspectRatio);
      if (expandedCanvasBlob) {
        imageBlob = expandedCanvasBlob;
      }
      
      let basePrompt = "Fill the transparent areas to naturally extend the image.";
      if (prompt) {
          basePrompt += ` The new areas should contain: ${prompt}`;
      }
      finalPrompt = basePrompt;
    }
    
    onApplyEdit(finalPrompt, imageBlob, maskBlob);
  };
  
  const handlePresetClick = (presetId: string, presetPrompt: string) => {
    if (!originalImage || isLoading) return;
    setApplyingPresetId(presetId);
    onApplyEdit(presetPrompt, originalImage, null);
  };

  const handleDownload = () => {
    if (!editedImageUrl) return;
    const link = document.createElement('a');
    link.href = editedImageUrl;
    const mimeType = editedImageUrl.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `potopix-edit.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCanvasMode = activeTool && ['custom', 'magic-eraser'].includes(activeTool.id) && !!originalImage;

  const renderControls = () => {
    if (!activeTool) return null;
    if (!originalImage) {
        return <p className="text-center text-gray-500 dark:text-gray-400">Upload an image to use this tool.</p>;
    }

    switch (activeTool.id) {
       case 'presets':
        return (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map(preset => (
                    <button 
                        key={preset.id} 
                        type="button"
                        onClick={() => handlePresetClick(preset.id, preset.prompt)}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed ${
                            isLoading && applyingPresetId === preset.id
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white'
                        }`}
                    >
                        {isLoading && applyingPresetId === preset.id ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                <span>Applying</span>
                            </div>
                        ) : (
                            preset.name
                        )}
                    </button>
                ))}
            </div>
        );

      case 'pas-photo':
        return <PasPhotoEditor clothing={clothing} setClothing={setClothing} background={background} setBackground={setBackground} />;
      
      case 'magic-eraser':
      case 'custom':
        return (
          <div className="w-full space-y-4">
            <div className="w-full">
              <label htmlFor="brush-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brush Size</label>
              <input id="brush-size" type="range" min="5" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={isLoading} />
            </div>
            {activeTool.id === 'custom' && (
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTool.placeholder} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow" disabled={isLoading} />
            )}
          </div>
        );

      case 'expand':
        const aspectRatios = ['16:9', '9:16', '4:3', '3:4', '1:1'];
        return (
          <div className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map(ratio => (
                  <button key={ratio} type="button" onClick={() => setExpandAspectRatio(ratio)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${expandAspectRatio === ratio ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTool.placeholder} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow" disabled={isLoading} />
          </div>
        );

      case 'ideas':
        return (
          <div className="w-full text-center">
            {isFetchingIdeas && <p className="text-gray-500 dark:text-gray-400">Generating creative ideas...</p>}
            {ideasError && <p className="text-red-500">{ideasError}</p>}
            {creativeIdeas && (
              <div className="space-y-2 text-left">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Here are some ideas:</p>
                  <ul className="list-disc list-inside space-y-2">
                    {creativeIdeas.map((idea, index) => (
                      <li key={index} onClick={() => handleIdeaClick(idea)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 text-sm">
                        {idea}
                      </li>
                    ))}
                  </ul>
              </div>
            )}
          </div>
        )
      
      case 'change-bg':
        return <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTool.placeholder || "Describe your edit..."} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow" disabled={isLoading} />;

      default:
        if (activeTool.requiresPrompt) {
          return <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTool.placeholder || "Describe your edit..."} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow" disabled={isLoading} />;
        }
        return null;
    }
  };

  const showSubmitButton = activeTool && activeTool.id !== 'presets' && (activeTool.requiresPrompt || ['pas-photo', 'magic-enhance', 'colorize', 'restore', 'ideas', 'magic-eraser'].includes(activeTool.id));

  const imageUrlForDisplay = isPeeking ? originalImageUrl : (editedImageUrl || originalImageUrl);

  return (
    <div className="w-full flex flex-col items-center space-y-4 max-w-2xl">
      <div className="w-full relative group">
        {isCanvasMode ? (
          <CanvasEditor 
            ref={canvasEditorRef} 
            imageUrl={imageUrlForDisplay!} 
            isLoading={isLoading} 
            brushSize={brushSize} 
            isPeeking={isPeeking}
          />
        ) : (
          <div className="w-full max-w-2xl aspect-square relative">
            <ImageDisplay 
              displayUrl={imageUrlForDisplay} 
              onImageUpload={onImageUpload} 
            />
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center rounded-lg z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                  <p className="mt-4 text-black dark:text-white">AI is thinking...</p>
              </div>
            )}
          </div>
        )}
        
        {editedImageUrl && !isLoading && (
          <>
            <button 
                onClick={handleDownload}
                className="absolute top-4 right-16 z-20 bg-black text-white dark:bg-white dark:text-black p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Download image"
                title="Download image"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button
                onMouseDown={() => setIsPeeking(true)}
                onMouseUp={() => setIsPeeking(false)}
                onMouseLeave={() => setIsPeeking(false)}
                onTouchStart={() => setIsPeeking(true)}
                onTouchEnd={() => setIsPeeking(false)}
                className="absolute top-4 right-4 z-20 bg-black text-white dark:bg-white dark:text-black p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Hold to see original"
                title="Hold to see original"
            >
                <EyeIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      
      {originalImage && 
        <button onClick={onClear} className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
          Upload another image
        </button>
      }

      <div className="w-full bg-gray-50 dark:bg-gray-950 p-6 rounded-lg min-h-[160px] flex flex-col justify-center">
        {!activeTool ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Select a tool from the sidebar to start editing.</p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="w-full flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-black dark:bg-gray-800 text-white dark:text-gray-200 rounded-lg flex items-center justify-center p-2">
                <activeTool.icon className="w-full h-full" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-black dark:text-white">{activeTool.name}</h3>
                {activeTool.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activeTool.description}</p>}
              </div>
            </div>
            
            <div className="w-full">
             {renderControls()}
            </div>

            {showSubmitButton && (
                <button
                    type="submit"
                    className="w-full px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isFetchingIdeas || !originalImage}
                >
                    {isFetchingIdeas ? 'Thinking...' : activeTool.actionLabel || 'Apply'}
                </button>
            )}
          </form>
        )}
      </div>

      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
};
