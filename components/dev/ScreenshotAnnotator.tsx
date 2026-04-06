'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pencil, 
  Eraser, 
  Type, 
  Undo2, 
  Redo2, 
  X, 
  Check, 
  Trash2, 
  Square, 
  Circle, 
  ArrowRight,
  EyeOff,
  Plus,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'blur' | null;

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
}

interface BlurArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  isEditing: boolean;
}

interface ScreenshotData {
  id: string;
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  strokes: Stroke[];
  shapes: Shape[];
  blurAreas: BlurArea[];
  texts: TextAnnotation[];
}

interface HistoryState {
  screenshots: ScreenshotData[];
  activeIndex: number;
}

interface ScreenshotAnnotatorProps {
  screenshots: string[];
  onSave: (annotatedImages: string[]) => void;
  onCancel: () => void;
}

// Draw arrow helper
const drawArrow = (
  ctx: CanvasRenderingContext2D, 
  fromX: number, 
  fromY: number, 
  toX: number, 
  toY: number, 
  color: string, 
  width: number,
  scale: number = 1
) => {
  const headLength = width * 3 * scale;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6), 
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6), 
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};

export function ScreenshotAnnotator({ screenshots: initialScreenshots, onSave, onCancel }: ScreenshotAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [currentBlur, setCurrentBlur] = useState<BlurArea | null>(null);
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<HistoryState[]>([{ screenshots: [], activeIndex: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [showThumbnails, setShowThumbnails] = useState(false);

  const activeScreenshot = screenshots[activeIndex];

  // Initialize screenshots from props
  useEffect(() => {
    const loadImages = async () => {
      const loadedScreenshots: ScreenshotData[] = [];
      
      for (let i = 0; i < initialScreenshots.length; i++) {
        const dataUrl = initialScreenshots[i];
        const img = new Image();
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            loadedScreenshots.push({
              id: Date.now().toString() + i,
              dataUrl,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              strokes: [],
              shapes: [],
              blurAreas: [],
              texts: [],
            });
            resolve();
          };
          img.src = dataUrl;
        });
      }
      
      setScreenshots(loadedScreenshots);
      if (loadedScreenshots.length > 0) {
        setImageSize({
          width: loadedScreenshots[0].naturalWidth,
          height: loadedScreenshots[0].naturalHeight,
        });
      }
      
      const newHistory = [{ screenshots: loadedScreenshots, activeIndex: 0 }];
      setHistory(newHistory);
      setHistoryIndex(0);
    };
    
    if (initialScreenshots.length > 0) {
      loadImages();
    }
  }, [initialScreenshots]);

  // Update image size when active screenshot changes
  useEffect(() => {
    if (activeScreenshot) {
      setImageSize({
        width: activeScreenshot.naturalWidth,
        height: activeScreenshot.naturalHeight,
      });
    }
  }, [activeScreenshot]);

  // Calculate scale to fit screen
  const getScale = useCallback(() => {
    if (!containerRef.current || imageSize.width === 0) return 1;
    const containerWidth = containerRef.current.clientWidth - 80;
    const containerHeight = containerRef.current.clientHeight - 160;
    const scaleX = containerWidth / imageSize.width;
    const scaleY = containerHeight / imageSize.height;
    return Math.min(scaleX, scaleY, 1);
  }, [imageSize]);

  // Draw everything on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScreenshot) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = getScale();
    const displayWidth = activeScreenshot.naturalWidth * scale;
    const displayHeight = activeScreenshot.naturalHeight * scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw screenshot
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      // Draw blur areas first (underneath other elements)
      activeScreenshot.blurAreas.forEach((blur: BlurArea) => {
        const x = blur.x * scale;
        const y = blur.y * scale;
        const w = blur.width * scale;
        const h = blur.height * scale;
        
        // Create pixelation effect
        const pixelSize = Math.max(4, Math.min(w, h) / 15);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        
        // Draw pixelated version
        ctx.imageSmoothingEnabled = false;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, w / pixelSize);
        tempCanvas.height = Math.max(1, h / pixelSize);
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, x, y, w, h, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, w, h);
        }
        ctx.restore();
        
        // Draw border around blur area
        ctx.strokeStyle = 'rgba(255, 115, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      });

      // Draw current blur
      if (currentBlur) {
        const x = currentBlur.x * scale;
        const y = currentBlur.y * scale;
        const w = currentBlur.width * scale;
        const h = currentBlur.height * scale;
        ctx.strokeStyle = '#FF7300';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      // Draw shapes
      activeScreenshot.shapes.forEach((shape: Shape) => {
        const sx = shape.startX * scale;
        const sy = shape.startY * scale;
        const ex = shape.endX * scale;
        const ey = shape.endY * scale;
        
        if (shape.type === 'rectangle') {
          ctx.beginPath();
          ctx.rect(sx, sy, ex - sx, ey - sy);
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = shape.width * scale;
          ctx.stroke();
        } else if (shape.type === 'circle') {
          const radius = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = shape.width * scale;
          ctx.stroke();
        } else if (shape.type === 'arrow') {
          drawArrow(ctx, sx, sy, ex, ey, shape.color, shape.width, 1);
        }
      });

      // Draw current shape
      if (currentShape) {
        const sx = currentShape.startX * scale;
        const sy = currentShape.startY * scale;
        const ex = currentShape.endX * scale;
        const ey = currentShape.endY * scale;
        
        if (currentShape.type === 'rectangle') {
          ctx.beginPath();
          ctx.rect(sx, sy, ex - sx, ey - sy);
          ctx.strokeStyle = currentShape.color;
          ctx.lineWidth = currentShape.width * scale;
          ctx.stroke();
        } else if (currentShape.type === 'circle') {
          const radius = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = currentShape.color;
          ctx.lineWidth = currentShape.width * scale;
          ctx.stroke();
        } else if (currentShape.type === 'arrow') {
          drawArrow(ctx, sx, sy, ex, ey, currentShape.color, currentShape.width, 1);
        }
      }

      // Draw strokes
      activeScreenshot.strokes.forEach((stroke: Stroke) => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * scale, stroke.points[i].y * scale);
        }
        ctx.strokeStyle = stroke.isEraser ? 'rgba(255,255,255,0.9)' : stroke.color;
        ctx.lineWidth = stroke.isEraser ? stroke.width * 2 * scale : stroke.width * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (stroke.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      });

      // Draw current stroke
      if (currentStroke && currentStroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentStroke.points[0].x * scale, currentStroke.points[0].y * scale);
        for (let i = 1; i < currentStroke.points.length; i++) {
          ctx.lineTo(currentStroke.points[i].x * scale, currentStroke.points[i].y * scale);
        }
        ctx.strokeStyle = currentStroke.isEraser ? 'rgba(255,255,255,0.9)' : currentStroke.color;
        ctx.lineWidth = currentStroke.isEraser ? currentStroke.width * 2 * scale : currentStroke.width * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (currentStroke.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    img.src = activeScreenshot.dataUrl;
  }, [activeScreenshot, currentStroke, currentShape, currentBlur, getScale]);

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Get canvas coordinates
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scale = getScale();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  // Start drawing
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeTool || activeTool === 'text') return;

    const point = getCanvasPoint(e);
    if (!point || !activeScreenshot) return;

    e.preventDefault();
    setIsDrawing(true);

    if (activeTool === 'pen' || activeTool === 'eraser') {
      setCurrentStroke({
        points: [point],
        color: '#FF7300',
        width: 3,
        isEraser: activeTool === 'eraser',
      });
    } else if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'arrow') {
      setCurrentShape({
        id: Date.now().toString(),
        type: activeTool,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        color: '#FF7300',
        width: 3,
      });
    } else if (activeTool === 'blur') {
      setCurrentBlur({
        id: Date.now().toString(),
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      });
    }
  };

  // Continue drawing
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    e.preventDefault();

    if (currentStroke) {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, point],
      });
    } else if (currentShape) {
      setCurrentShape({
        ...currentShape,
        endX: point.x,
        endY: point.y,
      });
    } else if (currentBlur) {
      setCurrentBlur({
        ...currentBlur,
        width: point.x - currentBlur.x,
        height: point.y - currentBlur.y,
      });
    }
  };

  // Add to history
  const addToHistory = (newScreenshots: ScreenshotData[], newActiveIndex: number) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ screenshots: newScreenshots, activeIndex: newActiveIndex });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // End drawing
  const handleMouseUp = () => {
    if (!isDrawing || !activeScreenshot) return;

    setIsDrawing(false);

    if (currentStroke) {
      const newScreenshots = [...screenshots];
      newScreenshots[activeIndex] = {
        ...activeScreenshot,
        strokes: [...activeScreenshot.strokes, currentStroke],
      };
      setScreenshots(newScreenshots);
      setCurrentStroke(null);
      addToHistory(newScreenshots, activeIndex);
    } else if (currentShape) {
      const newScreenshots = [...screenshots];
      newScreenshots[activeIndex] = {
        ...activeScreenshot,
        shapes: [...activeScreenshot.shapes, currentShape],
      };
      setScreenshots(newScreenshots);
      setCurrentShape(null);
      addToHistory(newScreenshots, activeIndex);
    } else if (currentBlur && Math.abs(currentBlur.width) > 10 && Math.abs(currentBlur.height) > 10) {
      const newScreenshots = [...screenshots];
      newScreenshots[activeIndex] = {
        ...activeScreenshot,
        blurAreas: [...activeScreenshot.blurAreas, {
          ...currentBlur,
          width: Math.abs(currentBlur.width),
          height: Math.abs(currentBlur.height),
          x: currentBlur.width < 0 ? currentBlur.x + currentBlur.width : currentBlur.x,
          y: currentBlur.height < 0 ? currentBlur.y + currentBlur.height : currentBlur.y,
        }],
      };
      setScreenshots(newScreenshots);
      setCurrentBlur(null);
      addToHistory(newScreenshots, activeIndex);
    } else {
      setCurrentBlur(null);
    }
  };

  // Handle canvas click for text
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool !== 'text' || !activeScreenshot) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const newText: TextAnnotation = {
      id: Date.now().toString(),
      x: point.x,
      y: point.y,
      text: '',
      isEditing: true,
    };

    const newScreenshots = [...screenshots];
    newScreenshots[activeIndex] = {
      ...activeScreenshot,
      texts: [...activeScreenshot.texts, newText],
    };
    setScreenshots(newScreenshots);
    addToHistory(newScreenshots, activeIndex);
  };

  // Update text
  const updateText = (id: string, text: string) => {
    if (!activeScreenshot) return;
    
    const newScreenshots = [...screenshots];
    newScreenshots[activeIndex] = {
      ...activeScreenshot,
      texts: activeScreenshot.texts.map((t: TextAnnotation) => t.id === id ? { ...t, text } : t),
    };
    setScreenshots(newScreenshots);
  };

  // Finish editing text
  const finishEditingText = (id: string) => {
    if (!activeScreenshot) return;
    
    const newScreenshots = [...screenshots];
    newScreenshots[activeIndex] = {
      ...activeScreenshot,
      texts: activeScreenshot.texts.map((t: TextAnnotation) => t.id === id ? { ...t, isEditing: false } : t),
    };
    setScreenshots(newScreenshots);
    addToHistory(newScreenshots, activeIndex);
  };

  // Delete text
  const deleteText = (id: string) => {
    if (!activeScreenshot) return;
    
    const newScreenshots = [...screenshots];
    newScreenshots[activeIndex] = {
      ...activeScreenshot,
      texts: activeScreenshot.texts.filter((t: TextAnnotation) => t.id !== id),
    };
    setScreenshots(newScreenshots);
    addToHistory(newScreenshots, activeIndex);
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setScreenshots(history[newIndex].screenshots);
      setActiveIndex(history[newIndex].activeIndex);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setScreenshots(history[newIndex].screenshots);
      setActiveIndex(history[newIndex].activeIndex);
    }
  };

  // Add new screenshot from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newScreenshot: ScreenshotData = {
          id: Date.now().toString(),
          dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          strokes: [],
          shapes: [],
          blurAreas: [],
          texts: [],
        };
        const newScreenshots = [...screenshots, newScreenshot];
        setScreenshots(newScreenshots);
        setActiveIndex(newScreenshots.length - 1);
        addToHistory(newScreenshots, newScreenshots.length - 1);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Remove screenshot
  const removeScreenshot = (index: number) => {
    if (screenshots.length <= 1) return;
    
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    setScreenshots(newScreenshots);
    
    const newIndex = Math.min(activeIndex, newScreenshots.length - 1);
    setActiveIndex(newIndex);
    addToHistory(newScreenshots, newIndex);
  };

  // Save all annotated images
  const handleSave = () => {
    const annotatedImages: string[] = [];
    let completed = 0;
    
    screenshots.forEach((screenshot, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = screenshot.naturalWidth;
      canvas.height = screenshot.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);

        // Draw blur areas
        screenshot.blurAreas.forEach((blur: BlurArea) => {
          const pixelSize = Math.max(4, Math.min(blur.width, blur.height) / 15);
          ctx.save();
          ctx.beginPath();
          ctx.rect(blur.x, blur.y, blur.width, blur.height);
          ctx.clip();
          
          ctx.imageSmoothingEnabled = false;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = Math.max(1, blur.width / pixelSize);
          tempCanvas.height = Math.max(1, blur.height / pixelSize);
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, blur.x, blur.y, blur.width, blur.height, 0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, blur.x, blur.y, blur.width, blur.height);
          }
          ctx.restore();
        });

        // Draw shapes
        screenshot.shapes.forEach((shape: Shape) => {
          if (shape.type === 'rectangle') {
            ctx.beginPath();
            ctx.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY);
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.width;
            ctx.stroke();
          } else if (shape.type === 'circle') {
            const radius = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2));
            ctx.beginPath();
            ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.width;
            ctx.stroke();
          } else if (shape.type === 'arrow') {
            drawArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY, shape.color, shape.width);
          }
        });

        // Draw strokes
        screenshot.strokes.forEach((stroke: Stroke) => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (stroke.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
          }
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        });

        // Draw texts
        ctx.font = '14px system-ui, sans-serif';
        screenshot.texts.forEach((text: TextAnnotation) => {
          if (!text.text.trim()) return;
          
          const padding = 8;
          const lineHeight = 20;
          const maxWidth = 200;
          
          const lines = text.text.split('\n');
          let maxLineWidth = 0;
          lines.forEach((line: string) => {
            const width = ctx.measureText(line).width;
            maxLineWidth = Math.max(maxLineWidth, width);
          });
          
          const boxWidth = Math.min(maxLineWidth + padding * 2, maxWidth);
          const boxHeight = lines.length * lineHeight + padding;

          ctx.fillStyle = '#FF7300';
          ctx.beginPath();
          ctx.roundRect(text.x, text.y, boxWidth, boxHeight, 8);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.textBaseline = 'top';
          lines.forEach((line: string, i: number) => {
            ctx.fillText(line, text.x + padding, text.y + padding + i * lineHeight, boxWidth - padding * 2);
          });
        });

        annotatedImages[index] = canvas.toDataURL('image/jpeg', 0.9);
        completed++;
        
        if (completed === screenshots.length) {
          onSave(annotatedImages.filter(Boolean));
        }
      };
      img.src = screenshot.dataUrl;
    });
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const scale = getScale();

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Penna' },
    { id: 'eraser', icon: Eraser, label: 'Gomma' },
    { id: 'text', icon: Type, label: 'Testo' },
    { id: 'rectangle', icon: Square, label: 'Rettangolo' },
    { id: 'circle', icon: Circle, label: 'Cerchio' },
    { id: 'arrow', icon: ArrowRight, label: 'Freccia' },
    { id: 'blur', icon: EyeOff, label: 'Blur' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-comodo text-lg text-white">Annota Screenshot</span>
          <span className="text-sm text-zinc-500">
            {screenshots.length > 1 ? `Immagine ${activeIndex + 1} di ${screenshots.length}` : 'Disegna per evidenziare il problema'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Thumbnail toggle */}
          {screenshots.length > 1 && (
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <ImageIcon className="h-4 w-4" />
              Gallery
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            <Check className="h-4 w-4" />
            Salva
          </button>
        </div>
      </div>

      {/* Thumbnails strip */}
      {showThumbnails && screenshots.length > 1 && (
        <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900 px-4 py-2">
          {screenshots.map((screenshot, index) => (
            <div
              key={screenshot.id}
              onClick={() => setActiveIndex(index)}
              className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                index === activeIndex ? 'border-primary' : 'border-transparent hover:border-zinc-600'
              }`}
            >
              <img
                src={screenshot.dataUrl}
                alt={`Screenshot ${index + 1}`}
                className="h-16 w-24 rounded object-cover"
              />
              <span className="absolute bottom-0 right-0 rounded-tl bg-black/50 px-1.5 py-0.5 text-xs text-white">
                {index + 1}
              </span>
              {screenshots.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeScreenshot(index);
                  }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            <Plus className="h-5 w-5" />
            <span className="mt-1 text-xs">Aggiungi</span>
          </button>
        </div>
      )}

      {/* Navigation (when thumbnails hidden) */}
      {!showThumbnails && screenshots.length > 1 && (
        <div className="flex items-center justify-center gap-4 border-b border-white/10 bg-zinc-900 py-2">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-zinc-400">
            {activeIndex + 1} / {screenshots.length}
          </span>
          <button
            onClick={() => setActiveIndex(Math.min(screenshots.length - 1, activeIndex + 1))}
            disabled={activeIndex === screenshots.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-4 flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Aggiungi
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-zinc-900 py-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(activeTool === tool.id ? null : (tool.id as Tool))}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              activeTool === tool.id
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
            title={tool.label}
          >
            <tool.icon className="h-5 w-5" />
          </button>
        ))}

        <div className="mx-2 h-6 w-px bg-zinc-700" />

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            canUndo
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              : 'cursor-not-allowed bg-zinc-800/50 text-zinc-600'
          }`}
          title="Undo"
        >
          <Undo2 className="h-5 w-5" />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            canRedo
              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              : 'cursor-not-allowed bg-zinc-800/50 text-zinc-600'
          }`}
          title="Redo"
        >
          <Redo2 className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-zinc-950"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex min-h-full items-center justify-center p-10">
          <div className="relative">
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              className="shadow-2xl"
              style={{
                cursor: activeTool === 'text' ? 'crosshair' : activeTool && activeTool !== 'pen' && activeTool !== 'eraser' ? 'crosshair' : activeTool ? 'none' : 'default',
              }}
            />

            {/* Text annotations overlay */}
            {activeScreenshot?.texts.map((text: TextAnnotation) => (
              <div
                key={text.id}
                className="absolute"
                style={{
                  left: text.x * scale,
                  top: text.y * scale,
                }}
              >
                {text.isEditing ? (
                  <div className="flex flex-col gap-1">
                    <textarea
                      autoFocus
                      value={text.text}
                      onChange={(e) => updateText(text.id, e.target.value)}
                      onBlur={() => finishEditingText(text.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          finishEditingText(text.id);
                        }
                        if (e.key === 'Escape') {
                          deleteText(text.id);
                        }
                      }}
                      placeholder="Scrivi un commento..."
                      className="min-w-[200px] resize-none rounded-lg border-0 bg-primary p-3 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                      rows={2}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => finishEditingText(text.id)}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        <Check className="h-3 w-3" />
                        Conferma
                      </button>
                      <button
                        onClick={() => deleteText(text.id)}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-red-400 hover:bg-zinc-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Elimina
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      const newScreenshots = [...screenshots];
                      newScreenshots[activeIndex] = {
                        ...activeScreenshot,
                        texts: activeScreenshot.texts.map((t: TextAnnotation) => t.id === text.id ? { ...t, isEditing: true } : t),
                      };
                      setScreenshots(newScreenshots);
                    }}
                    className="max-w-[200px] cursor-pointer rounded-lg bg-primary p-3 text-sm text-white shadow-lg transition-all hover:brightness-110"
                  >
                    {text.text.split('\n').map((line: string, i: number) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
