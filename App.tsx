import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Generator } from './components/Generator';
import type { Tool } from './types';
import { editImage, editImageWithMask } from './services/geminiService';
import { MenuIcon } from './components/icons/MenuIcon';
import { XIcon } from './components/icons/XIcon';
import { LandscapeIcon } from './components/icons/LandscapeIcon';
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';
import { UserCircleIcon } from './components/icons/UserCircleIcon';
import { PencilIcon } from './components/icons/PencilIcon';
import { SunIcon } from './components/icons/SunIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GridIcon } from './components/icons/GridIcon';
import { BrushIcon } from './components/icons/BrushIcon';
import { ExpandIcon } from './components/icons/ExpandIcon';
import { ColorizeIcon } from './components/icons/ColorizeIcon';
import { BandageIcon } from './components/icons/BandageIcon';
import { SuggestionIcon } from './components/icons/SuggestionIcon';
import { MagicWandIcon } from './components/icons/MagicWandIcon';
import { PencilSwooshIcon } from './components/icons/PencilSwooshIcon';
import { ImagePlusIcon } from './components/icons/ImagePlusIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import { LoginPage } from './components/LoginPage';
import { LogoutIcon } from './components/icons/LogoutIcon';


const tools: Tool[] = [
  { id: 'change-bg', name: 'Change Background', prompt: '', icon: LandscapeIcon, requiresPrompt: true, placeholder: 'e.g., a sunny beach with palm trees', description: 'Replace the original background with a new scene described by you.' },
  { id: 'add-object', name: 'Add Something', prompt: '', icon: PlusCircleIcon, requiresPrompt: true, placeholder: 'e.g., add a funny hat on the person', description: 'Insert a new object or element into your image by describing it.' },
  { id: 'magic-eraser', name: 'Magic Eraser', prompt: 'Remove the object indicated by the mask. Fill the background realistically and seamlessly, matching the surrounding texture, lighting, and style of the original image.', icon: MagicWandIcon, requiresPrompt: false, actionLabel: 'Erase', description: 'Paint over an object or distraction to magically remove it from your photo.' },
  { id: 'magic-adjust', name: 'Magic Adjust', prompt: '', icon: SunIcon, requiresPrompt: true, placeholder: 'e.g., "make it warmer and brighter"', description: 'Adjust lighting and color using simple text commands.' },
  { id: 'change-style', name: 'Change Style', prompt: '', icon: BrushIcon, requiresPrompt: true, placeholder: 'e.g., make it look like a watercolor painting', description: 'Transform the artistic style of your photo (e.g., cartoon, sketch, oil painting).' },
  { id: 'expand', name: 'Generative Expand', prompt: '', icon: ExpandIcon, requiresPrompt: true, placeholder: 'Describe what to add in the new areas (optional)', description: "Extend your photo's canvas and let AI fill in the new areas." },
  { id: 'magic-enhance', name: 'Magic Enhance', prompt: 'Dramatically enhance the quality of this image. Improve sharpness, clarity, lighting, and color vibrancy to make it look professionally edited.', icon: SparklesIcon, requiresPrompt: false, description: 'Automatically improves sharpness, clarity, and color. Does not change image dimensions.' },
  { id: 'colorize', name: 'Colorize', prompt: "Colorize this black and white photograph. Use artificial intelligence to add realistic and historically appropriate colors to the image, bringing the scene to life as if it were captured in color. Pay attention to skin tones, clothing, and background elements to ensure a natural and believable result.", icon: ColorizeIcon, requiresPrompt: false, description: 'Automatically colorizes black & white photos with realistic colors.' },
  { id: 'restore', name: 'Photo Restoration', prompt: "Restore this old, damaged photograph. Automatically repair scratches, creases, tears, stains, and fading. Enhance the clarity, sharpen details, and correct any color degradation to bring the image back to its original quality as much as possible.", icon: BandageIcon, requiresPrompt: false, description: 'Fixes scratches, stains, and fading on old or damaged photos.' },
  { id: 'pas-photo', name: 'Pas Photo', prompt: '', icon: UserCircleIcon, requiresPrompt: true, placeholder: '', description: 'Convert your photo into a professional passport picture with a formal look.' },
  { id: 'custom', name: 'Canvas Edit', prompt: '', icon: PencilIcon, requiresPrompt: true, placeholder: 'Describe the change for the selected area...', description: 'Paint over an area of the image and tell the AI what changes to make there.' },
  { id: 'ideas', name: 'Creative Ideas', prompt: '', icon: SuggestionIcon, requiresPrompt: false, actionLabel: 'Get Ideas', description: 'Let AI analyze your photo and suggest creative editing ideas.' },
  { id: 'presets', name: 'Presets', prompt: '', icon: GridIcon, requiresPrompt: false, description: 'Apply professionally designed, one-click presets to transform your photo.' },
];

type Mode = 'editor' | 'generator';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>('editor');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPrefs = window.localStorage.getItem('theme');
      if (typeof storedPrefs === 'string') {
        return storedPrefs as Theme;
      }
      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Check session storage for auth status on initial load
    const loggedIn = sessionStorage.getItem('isAuthenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (username, password) => {
    const validUsername = process.env.APP_USERNAME || 'admin';
    const validPassword = process.env.APP_PASSWORD || 'password';

    if (username === validUsername && password === validPassword) {
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };


  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setEditedImageUrl(null);
    setError(null);
    
    // Create a URL for the original image for the mask utility
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);
  };
  
  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setError(null);
  };

  const handleApplyEdit = useCallback(async (prompt: string, imageBlob: File | Blob, maskBlob?: Blob | null) => {
    const imageToProcess = imageBlob || originalImage;
    if (!imageToProcess || !originalImageUrl) {
      setError("Please upload an image first.");
      return;
    }
    if (activeTool?.requiresPrompt && !prompt.trim() && activeTool?.id !== 'expand') {
      setError("Please enter a description of the edit you want to make.");
      return;
    }
    if ((activeTool?.id === 'custom' || activeTool?.id === 'magic-eraser') && !maskBlob) {
        setError("Please draw on the image to select an area to edit.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    let finalPrompt;
    if (activeTool?.id === 'ideas') {
      finalPrompt = prompt;
    } else {
      finalPrompt = activeTool?.requiresPrompt ? prompt : activeTool?.prompt || '';
    }
     // For presets, the prompt is passed directly
    if (activeTool?.id === 'presets') {
        finalPrompt = prompt;
    }

    if (!finalPrompt) {
        setError("The selected action did not provide a valid prompt.");
        setIsLoading(false);
        return;
    }

    try {
      let result;
      const imageFile = imageToProcess instanceof File ? imageToProcess : new File([imageToProcess], "image.png", { type: "image/png" });
      
      if ((activeTool?.id === 'custom' || activeTool?.id === 'magic-eraser') && maskBlob) {
        result = await editImageWithMask(imageFile, maskBlob, finalPrompt);
      } else {
        result = await editImage(imageFile, finalPrompt);
      }

      if (result.image) {
        setEditedImageUrl(result.image);
      } else {
        setError(result.text || "The AI could not generate an image from your request. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, activeTool, originalImageUrl]);
  
  const handleClear = () => {
    if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImage(null);
    setEditedImageUrl(null);
    setError(null);
    setActiveTool(null);
    setOriginalImageUrl(null);
  }

  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
  }

  const handleSendToEditor = async (imageUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const file = await dataUrlToFile(imageUrl, `jawani-generated-${Date.now()}.png`);
      handleImageUpload(file);
      setActiveMode('editor');
      setActiveTool(null);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Could not load the generated image into the editor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: Mode) => {
    setActiveMode(mode);
    setError(null);
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen font-sans flex">
      {activeMode === 'editor' && (
        <>
          <div className="fixed top-4 left-4 z-30 md:hidden">
            <button onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">
              {isMobileSidebarOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        
          <Sidebar 
            tools={tools}
            onToolSelect={handleToolSelect} 
            activeTool={activeTool}
            isMobileOpen={isMobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </>
      )}
      
      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out ${activeMode === 'editor' ? (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : 'md:ml-0'}`}>
        <div className="w-full h-full flex flex-col items-center justify-start pt-8 md:pt-0">
            <div className="text-center mb-8 relative w-full">
                <h1 className="text-4xl md:text-6xl font-fugaz text-black dark:text-white">
                    Jawani
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Recreated by Sheetizen.</p>
                 <div className="absolute top-0 right-0 flex items-center space-x-2">
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon /> : <SunIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Logout"
                        title="Logout"
                    >
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                 </div>
            </div>

            <div className="flex justify-center space-x-2 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <button
                    onClick={() => handleModeChange('editor')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeMode === 'editor' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <PencilSwooshIcon className="w-5 h-5" />
                        <span>Editor</span>
                    </div>
                </button>
                <button
                    onClick={() => handleModeChange('generator')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeMode === 'generator' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <ImagePlusIcon className="w-5 h-5" />
                        <span>Generator</span>
                    </div>
                </button>
            </div>

            {activeMode === 'editor' ? (
              <Editor
                  tools={tools}
                  originalImage={originalImage}
                  editedImageUrl={editedImageUrl}
                  onImageUpload={handleImageUpload}
                  isLoading={isLoading}
                  error={error}
                  activeTool={activeTool}
                  onApplyEdit={handleApplyEdit}
                  onToolSelect={handleToolSelect}
                  onClear={handleClear}
              />
            ) : (
              <Generator onSendToEditor={handleSendToEditor} />
            )}
            
            <footer className="w-full text-center mt-12 pb-8">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2025 Jawani. Recreated by Sheetizen. Powered by Google Gemini.
              </p>
            </footer>
        </div>
      </main>
    </div>
  );
};

export default App;