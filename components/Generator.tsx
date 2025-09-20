import React, { useState, useRef, useEffect } from 'react';
import { generateImages, generateImageWithReference, generatePromptIdeas } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { XIcon } from './icons/XIcon';
import { ImagePlusIcon } from './icons/ImagePlusIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';


interface GeneratorProps {
    onSendToEditor: (imageUrl: string) => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type GeneratorMode = 'no-reference' | 'with-reference';

const aspectRatios: { id: AspectRatio, name: string }[] = [
    { id: '1:1', name: 'Square' },
    { id: '16:9', name: 'Landscape' },
    { id: '9:16', name: 'Portrait' },
    { id: '4:3', name: 'Standard' },
    { id: '3:4', name: 'Vertical' },
];

export const Generator: React.FC<GeneratorProps> = ({ onSendToEditor }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [mode, setMode] = useState<GeneratorMode>('no-reference');
    const [referenceImages, setReferenceImages] = useState<File[]>([]);
    const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for the prompt idea generator
    const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);
    const [productName, setProductName] = useState('');
    const [productPosition, setProductPosition] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [promptIdeas, setPromptIdeas] = useState<string[]>([]);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [ideaError, setIdeaError] = useState<string | null>(null);


    // Effect to revoke object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            referenceImageUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [referenceImageUrls]);
    
    const handleModeChange = (newMode: GeneratorMode) => {
        setMode(newMode);
        // Reset state when switching modes
        setPrompt('');
        setError(null);
        setGeneratedImages([]);
        setReferenceImages([]);
        setReferenceImageUrls([]);
        // Reset idea generator state
        setIsIdeaFormOpen(false);
        setPromptIdeas([]);
        setIdeaError(null);
        setProductName('');
        setProductPosition('');
        setAdditionalInfo('');
    };
    
    const handleReferenceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            setReferenceImages(prev => [...prev, ...files]);
            setReferenceImageUrls(prev => [...prev, ...urls]);
        }
    };

    const handleRemoveReferenceImage = (indexToRemove: number) => {
        // Revoke the specific URL before removing it from state
        URL.revokeObjectURL(referenceImageUrls[indexToRemove]);
        setReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setReferenceImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            return;
        }

        if (numberOfImages < 1 || numberOfImages > 10) {
            setError("Number of images must be between 1 and 10.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            let images: string[] = [];
            if (mode === 'no-reference') {
                images = await generateImages(prompt, numberOfImages, aspectRatio);
            } else {
                if (referenceImages.length === 0) {
                    setError("Please upload at least one reference image.");
                    setIsLoading(false);
                    return;
                }
                // Generate multiple images by calling the service function in parallel
                const imagePromises = Array.from({ length: numberOfImages }, () => 
                    generateImageWithReference(referenceImages, prompt, aspectRatio)
                );
                const results = await Promise.all(imagePromises);
                images = results.flat(); // Flatten the array of arrays which each contain one image
            }
            setGeneratedImages(images);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateIdeas = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsGeneratingIdeas(true);
        setIdeaError(null);
        setPromptIdeas([]);

        try {
            let formData = { productName: '', productPosition: '', additionalInfo: '' };
            let imagesToAnalyze: File[] = [];

            if (mode === 'no-reference') {
                formData = { productName, productPosition, additionalInfo };
            } else { // mode === 'with-reference'
                imagesToAnalyze = referenceImages;
            }
            const ideas = await generatePromptIdeas(formData, imagesToAnalyze);
            setPromptIdeas(ideas);
        } catch (e) {
            setIdeaError(e instanceof Error ? e.message : "Could not generate ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleIdeaClick = (idea: string) => {
        setPrompt(idea);
    };

    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `jawani-generated-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleNumberOfImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? 1 : Number(e.target.value);
        if (value >= 1 && value <= 10) {
            setNumberOfImages(value);
        }
    };
    
    const handleNumberOfImagesBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value < 1) {
            setNumberOfImages(1);
        } else if (value > 10) {
            setNumberOfImages(10);
        }
    }
    
    const renderIdeaGeneratorResults = () => {
        if (ideaError) {
            return <p className="text-red-500 text-sm text-center mt-4">{ideaError}</p>;
        }
        
        if (promptIdeas.length > 0) {
            return (
                <div className="space-y-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-md">Click an idea to use it:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {promptIdeas.map((idea, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleIdeaClick(idea)}
                                className="text-left text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
                            >
                                {idea}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    }


    return (
        <div className="w-full flex flex-col items-center space-y-4 max-w-4xl">
            <div className="w-full bg-gray-50 dark:bg-gray-950 p-6 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {mode === 'no-reference' && (
                         <div className="w-full mb-4">
                            <button
                                type="button"
                                onClick={() => setIsIdeaFormOpen(!isIdeaFormOpen)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-800 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                <LightBulbIcon className="w-5 h-5" />
                                <span>Generate Prompt Ideas</span>
                            </button>
                        </div>
                    )}

                    {mode === 'no-reference' && isIdeaFormOpen && (
                        <div className="w-full p-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 space-y-4">
                            <h3 className="font-semibold text-lg">Prompt Idea Helper</h3>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                                    <input
                                        type="text"
                                        id="product-name"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="e.g., Handmade leather shoes"
                                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="product-position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Position / Action</label>
                                    <input
                                        type="text"
                                        id="product-position"
                                        value={productPosition}
                                        onChange={(e) => setProductPosition(e.target.value)}
                                        placeholder="e.g., Placed on a rustic wooden table"
                                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Details</label>
                                    <textarea
                                        id="additional-info"
                                        value={additionalInfo}
                                        onChange={(e) => setAdditionalInfo(e.target.value)}
                                        placeholder="Style, background, mood, colors, etc."
                                        rows={3}
                                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 resize-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGeneratingIdeas ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                        <span>Generating Ideas...</span>
                                    </>
                                ) : "Generate 4 Ideas"}
                            </button>
                            {renderIdeaGeneratorResults()}
                        </div>
                    )}

                    <div className="flex justify-center space-x-2 mb-4 p-1 bg-gray-200 dark:bg-gray-800 rounded-full">
                        <button
                            type="button"
                            onClick={() => handleModeChange('no-reference')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'no-reference' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            No Reference
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('with-reference')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'with-reference' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            With Reference
                        </button>
                    </div>

                    {mode === 'with-reference' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference Images</label>
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleReferenceImageChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    multiple
                                />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <ImagePlusIcon className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload images</p>
                                </div>
                            </div>
                            {referenceImageUrls.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {referenceImageUrls.map((url, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover rounded-md"/>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveReferenceImage(index)}
                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                                                aria-label="Remove image"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                             {referenceImages.length > 0 && (
                                <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={handleGenerateIdeas}
                                        disabled={isGeneratingIdeas}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isGeneratingIdeas ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                                <span>Generating Ideas...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LightBulbIcon className="w-5 h-5" />
                                                <span>Generate Prompt Ideas from Images</span>
                                            </>
                                        )}
                                    </button>
                                    {renderIdeaGeneratorResults()}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="prompt-input" className="sr-only">Image Prompt</label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'no-reference' ? "A vibrant oil painting of a futuristic city..." : "A person wearing a spacesuit, similar style..."}
                            className="w-full px-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow resize-none"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-2">
                                {aspectRatios.map(ratio => (
                                    <button key={ratio.id} type="button" onClick={() => setAspectRatio(ratio.id)} disabled={isLoading} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === ratio.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                        {ratio.name} ({ratio.id})
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="image-count-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Number of Images
                            </label>
                            <input
                                id="image-count-input"
                                type="number"
                                min="1"
                                max="10"
                                value={numberOfImages}
                                onChange={handleNumberOfImagesChange}
                                onBlur={handleNumberOfImagesBlur}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            'Generate'
                        )}
                    </button>
                </form>
            </div>
            
            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            
            <div className="w-full mt-8">
                {isLoading && (
                    <div className="text-center p-8">
                        <p className="text-gray-500 dark:text-gray-400">The AI is creating your masterpiece. This may take a moment...</p>
                    </div>
                )}

                {generatedImages.length > 0 && (
                    <div className={`grid gap-4 grid-cols-1 ${generatedImages.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'}`}>
                        {generatedImages.map((imageSrc, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={imageSrc} alt={`Generated image ${index + 1}`} className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => handleDownload(imageSrc, index)} title="Download Image" className="p-3 bg-white/80 text-black rounded-full hover:bg-white transition-colors">
                                        <DownloadIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => onSendToEditor(imageSrc)} title="Send to Editor" className="p-3 bg-white/80 text-black rounded-full hover:bg-white transition-colors">
                                        <PaperAirplaneIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};