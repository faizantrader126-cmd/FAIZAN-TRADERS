import React from 'react';

interface LogoProps {
  className?: string;
  showPhone?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showPhone = false, size = 'md' }: LogoProps) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div className={`flex flex-col items-center select-none text-brand-black ${className}`}>
      {/* High-Fidelity Circular Monogram Badge with Labyrinth Rings & SFT cursive monogram */}
      <div 
        className={`relative flex items-center justify-center transition-all duration-300 hover:rotate-3 ${
          isSmall ? 'h-12 w-12' : isLarge ? 'h-28 w-28' : 'h-16 w-16'
        }`}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="h-full w-full text-brand-black select-none"
          fill="none" 
          stroke="currentColor"
        >
          {/* Ring 1 - Outermost segmented circular maze */}
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            strokeWidth="5" 
            strokeDasharray="65 14 30 12 40 15 20 10" 
            strokeLinecap="round" 
            className="origin-center -rotate-45 text-brand-black"
          />
          {/* Ring 2 - Middle segmented circular maze */}
          <circle 
            cx="50" 
            cy="50" 
            r="35" 
            strokeWidth="4" 
            strokeDasharray="45 10 70 15 25 12" 
            strokeLinecap="round" 
            className="origin-center rotate-45 text-brand-black"
          />
          {/* Ring 3 - Inner segmented circular maze */}
          <circle 
            cx="50" 
            cy="50" 
            r="28" 
            strokeWidth="3.2" 
            strokeDasharray="60 15 25 10 50 12" 
            strokeLinecap="round" 
            className="origin-center -rotate-90 text-brand-black"
          />
          {/* Ring 4 - Fine dotted/dashed inner separator */}
          <circle 
            cx="50" 
            cy="50" 
            r="22" 
            strokeWidth="1.5" 
            strokeDasharray="3 3" 
            className="text-brand-black/40"
            opacity="0.6"
          />
          
          {/* TM Trademark indicator at top right */}
          <text 
            x="81" 
            y="26" 
            fontFamily="sans-serif" 
            fontWeight="900" 
            fontSize="5.5" 
            fill="currentColor"
          >
            TM
          </text>

          {/* SFT Monogram Design customized from official symbol curves */}
          {/* Ornate flowing "S" anchor */}
          <path 
            d="M 43,36 C 36,36 32,40 32,47 C 32,55 38,59 45,59 C 49.5,59 52,55 49,50.5 C 46,46.5 42,48.5 42,46.5 C 42,44.5 46,43.5 49,45.5 Q 50.5,47 50.5,49" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            className="text-brand-black"
          />
          {/* Embedded cursive "F" bar */}
          <path 
            d="M 51.5,42 Q 50,50 51,57 M 47.5,48.5 H 53" 
            strokeWidth="2.8" 
            strokeLinecap="round" 
            className="text-brand-black"
          />
          {/* Bold foundational "T" cap and stem */}
          <path 
            d="M 54.5,39.5 H 64.5 M 59.5,39.5 V 58" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-brand-black"
          />
        </svg>
      </div>

      {/* Brand Text Elements */}
      <div className="mt-1.5 text-center font-sans">
        <h1 
          className={`font-display font-black uppercase tracking-[0.22em] text-brand-black leading-none ${
            isSmall ? 'text-[11px]' : isLarge ? 'text-2xl' : 'text-sm'
          }`}
        >
          Faizan
        </h1>
        <div 
          className={`flex items-center justify-center font-sans font-bold uppercase tracking-[0.14em] text-brand-black/85 leading-none ${
            isSmall ? 'text-[6px] mt-1' : isLarge ? 'text-xs mt-2' : 'text-[8px] mt-1.5'
          }`}
        >
          <span className="mr-1 opacity-50">&#8212;</span> TRADERS <span className="ml-1 opacity-50">&#8212;</span>
        </div>
      </div>

      {/* Styled Phone Indicator beneath logo */}
      {showPhone && (
        <a 
          href="tel:+9203303511464"
          className={`mt-2 flex items-center justify-center rounded-full bg-brand-lightgray px-3.5 py-1 font-mono font-bold text-brand-black border border-brand-black/10 hover:bg-brand-black hover:text-white transition-colors duration-200 ${
            isSmall ? 'text-[8px] px-2 py-0.5' : 'text-[10px]'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="mr-1.5 h-3 w-3"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          0330 3511464
        </a>
      )}
    </div>
  );
}
