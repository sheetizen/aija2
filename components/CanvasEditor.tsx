import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CanvasEditorProps {
  imageUrl: string;
  isLoading: boolean;
  brushSize: number;
  isPeeking: boolean;
}

export interface CanvasEditorRef {
  getMaskAsBlob: () => Promise<Blob | null>;
  clearMask: () => void;
}

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(
  ({ imageUrl, isLoading, brushSize, isPeeking }, ref) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawing, setHasDrawing] = useState(false);

    const resizeCanvas = () => {
      const image = imageRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (image && canvas && container) {
        const { width, height, top, left } = image.getBoundingClientRect();
        const { top: containerTop, left: containerLeft } = container.getBoundingClientRect();
        
        canvas.width = width;
        canvas.height = height;
        canvas.style.top = `${top - containerTop}px`;
        canvas.style.left = `${left - containerLeft}px`;
      }
    };

    useEffect(() => {
      const image = imageRef.current;
      if (image) {
        image.addEventListener('load', resizeCanvas);
        window.addEventListener('resize', resizeCanvas);

        // if image is already cached and loaded
        if (image.complete) {
            resizeCanvas();
        }

        return () => {
          image.removeEventListener('load', resizeCanvas);
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }, [imageUrl]);
    
    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) { // Touch event
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        // Mouse event
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        setIsDrawing(true);
        setHasDrawing(true);
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Semi-transparent red
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    const stopDrawing = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
      setIsDrawing(false);
    };

    const clearMask = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasDrawing(false);
    };

    useImperativeHandle(ref, () => ({
      getMaskAsBlob: () => {
        return new Promise((resolve) => {
          const image = imageRef.current;
          const displayCanvas = canvasRef.current;
          if (!image || !displayCanvas || !hasDrawing) {
            resolve(null);
            return;
          }
          
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = image.naturalWidth;
          maskCanvas.height = image.naturalHeight;
          const maskCtx = maskCanvas.getContext('2d');
          
          if(maskCtx){
            // Fill with black (unmasked area)
            maskCtx.fillStyle = '#000000';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            // Draw the user's strokes in white (masked area)
            // We need to scale the drawing from the display canvas to the natural size canvas
            const scaleX = image.naturalWidth / displayCanvas.width;
            const scaleY = image.naturalHeight / displayCanvas.height;
            maskCtx.scale(scaleX, scaleY);
            maskCtx.drawImage(displayCanvas, 0, 0);
          }

          maskCanvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
      },
      clearMask
    }));

    return (
      <div ref={containerRef} className="w-full max-w-2xl aspect-square rounded-lg relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center rounded-lg z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                <p className="mt-4 text-black dark:text-white">AI is thinking...</p>
            </div>
        )}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Editable"
          className="w-full h-full rounded-lg object-contain"
          crossOrigin="anonymous" // Important for canvas operations
        />
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 z-10 cursor-crosshair ${isPeeking ? 'hidden' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {hasDrawing && !isLoading && (
            <button 
                onClick={clearMask} 
                className="absolute bottom-4 right-4 z-20 bg-white/80 text-black dark:bg-black/80 dark:text-white px-3 py-1 rounded-md text-sm hover:bg-white dark:hover:bg-black transition-colors"
            >
                Clear Mask
            </button>
        )}
      </div>
    );
  }
);