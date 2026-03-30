'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FakeSearchBarProps {
  className?: string;
  delay?: number;
}

export function FakeSearchBar({ className, delay = 500 }: FakeSearchBarProps) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caterpillarSegments, setCaterpillarSegments] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trova la barra di ricerca reale
  const findRealSearchInput = useCallback((): HTMLInputElement | null => {
    const byLabel = document.querySelector('[aria-label="Cerca carte"]') as HTMLInputElement;
    if (byLabel) return byLabel;
    
    const header = document.querySelector('header');
    if (header) {
      const inputs = header.querySelectorAll('input[type="text"]');
      for (const input of inputs) {
        const htmlInput = input as HTMLInputElement;
        if (htmlInput.classList.contains('w-full') || htmlInput.placeholder?.toLowerCase().includes('cerca')) {
          return htmlInput;
        }
      }
    }
    
    const allInputs = document.querySelectorAll('input[type="text"]');
    for (const input of allInputs) {
      const rect = input.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 20) {
        return input as HTMLInputElement;
      }
    }
    
    return null;
  }, []);

  // Invia il testo alla barra reale
  const submitToRealSearch = useCallback(() => {
    if (!localValue.trim()) return;
    
    const realInput = findRealSearchInput();
    if (realInput) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        realInput.focus();
        realInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        realInput.value = localValue;
        realInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        setLocalValue('');
        setCaterpillarSegments([]);
        
        setTimeout(() => setIsSubmitting(false), 500);
      }, 300);
    }
  }, [localValue, findRealSearchInput]);

  // Gestisce la digitazione locale
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    const segments: string[] = [];
    for (let i = 0; i < newValue.length; i += 2) {
      segments.push(newValue.slice(i, i + 2));
    }
    setCaterpillarSegments(segments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitToRealSearch();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue.trim()) {
      submitToRealSearch();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const baseWidth = 280;
  const extraWidth = Math.min(localValue.length * 12, 300);
  const dynamicWidth = baseWidth + extraWidth;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col items-center gap-4',
        'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 fill-mode-backwards',
        isSubmitting && 'animate-submit-shoot',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        onClick={handleContainerClick}
        className={cn(
          'relative flex items-center cursor-text overflow-visible',
          'transition-all duration-200 ease-out',
          isFocused && 'scale-105'
        )}
        style={{ width: dynamicWidth }}
      >
        {/* Testa del bruco */}
        <div 
          className={cn(
            'relative z-20 flex items-center justify-center w-14 h-14 rounded-full shrink-0 transition-all duration-300',
            'bg-gradient-to-br from-[#FF7300] to-[#FF8800] shadow-lg',
            isFocused && 'animate-caterpillar-head-bounce',
            localValue.length > 0 && 'animate-head-wiggle'
          )}
        >
          {isSubmitting ? (
            <Sparkles className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Search className="w-6 h-6 text-white" />
          )}
          
          {/* Occhi */}
          <div className="absolute -top-1 left-2 w-2 h-2 bg-white rounded-full animate-blink" />
          <div className="absolute -top-1 right-2 w-2 h-2 bg-white rounded-full animate-blink" style={{ animationDelay: '0.1s' }} />
          
          {/* Antenne */}
          <div className="absolute -top-3 left-3 w-0.5 h-3 bg-[#FF7300] rotate-[-20deg]" />
          <div className="absolute -top-3 right-3 w-0.5 h-3 bg-[#FF7300] rotate-[20deg]" />
        </div>

        {/* Corpo del bruco */}
        <div className="flex items-center -ml-2">
          {caterpillarSegments.map((segment, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center h-12 px-3 -ml-3',
                'rounded-full border-2 shadow-md',
                'transition-all duration-150 animate-caterpillar-segment-pop',
                'hover:scale-110 hover:z-10'
              )}
              style={{
                backgroundColor: index % 2 === 0 ? '#FF7300' : '#FF8800',
                borderColor: index % 2 === 0 ? '#FF8800' : '#FF7300',
                animationDelay: `${index * 0.05}s`,
                zIndex: caterpillarSegments.length - index,
              }}
            >
              <span className="text-white font-bold text-sm whitespace-nowrap">
                {segment}
              </span>
            </div>
          ))}
          
          {/* Segmento input */}
          <div 
            className={cn(
              'flex items-center h-12 px-4 -ml-3 min-w-[80px]',
              'rounded-full border-2 bg-white/90 backdrop-blur',
              'transition-all duration-200',
              isFocused 
                ? 'border-[#FF7300] shadow-[0_0_20px_rgba(255,115,0,0.4)]' 
                : 'border-gray-300 shadow-md'
            )}
            style={{ zIndex: 0 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={caterpillarSegments.length === 0 ? 'Cerca...' : ''}
              className="w-full bg-transparent text-base font-bold text-[#1D3160] placeholder:text-gray-400 outline-none min-w-[60px]"
            />
          </div>
        </div>

        {/* Coda */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            submitToRealSearch();
          }}
          disabled={!localValue.trim() || isSubmitting}
          className={cn(
            'relative z-20 flex items-center justify-center w-12 h-12 rounded-full -ml-3 shrink-0',
            'transition-all duration-200',
            localValue.trim() && !isSubmitting
              ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-lg hover:scale-110 cursor-pointer animate-tail-wiggle'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          <Send className={cn(
            'w-5 h-5 transition-all',
            localValue.trim() ? 'text-white' : 'text-gray-500'
          )} />
        </button>
      </div>

      {/* Istruzioni */}
      <div className={cn(
        'text-xs font-medium transition-all duration-300',
        isFocused ? 'text-[#FF7300] opacity-100' : 'text-gray-400 opacity-70'
      )}>
        {localValue.length > 0 
          ? 'Premi Invio o clicca fuori per cercare!' 
          : 'Scrivi qualcosa... il bruco cresce! 🐛'}
      </div>

      {/* Contatore */}
      {localValue.length > 0 && (
        <div className="absolute -top-2 right-0 px-3 py-1 bg-[#FF7300] text-white text-xs font-bold rounded-full animate-bounce">
          {localValue.length} 🐛
        </div>
      )}

      <style jsx global>{`
        @keyframes caterpillar-head-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-3deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(3deg); }
        }
        @keyframes head-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes caterpillar-segment-pop {
          0% { transform: scale(0) translateX(-20px); opacity: 0; }
          50% { transform: scale(1.2) translateX(0); }
          100% { transform: scale(1) translateX(0); opacity: 1; }
        }
        @keyframes tail-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes submit-shoot {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(100px) scale(0.8); opacity: 0.5; }
          100% { transform: translateX(200px) scale(0); opacity: 0; }
        }
        .animate-caterpillar-head-bounce { animation: caterpillar-head-bounce 1s ease-in-out infinite; }
        .animate-head-wiggle { animation: head-wiggle 0.3s ease-in-out; }
        .animate-caterpillar-segment-pop { animation: caterpillar-segment-pop 0.3s ease-out forwards; }
        .animate-tail-wiggle { animation: tail-wiggle 0.5s ease-in-out infinite; }
        .animate-blink { animation: blink 3s ease-in-out infinite; }
        .animate-submit-shoot { animation: submit-shoot 0.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}
