import React from 'react';

interface TalkeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const TalkeLogo: React.FC<TalkeLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { scale: 0.75, text: 'text-lg', sub: 'text-[9px]' },
    md: { scale: 1, text: 'text-2xl', sub: 'text-[11px]' },
    lg: { scale: 1.3, text: 'text-3xl', sub: 'text-xs' },
    xl: { scale: 1.6, text: 'text-4xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center tracking-tight">
        {/* Main TALKÊ Text with Ocean Blue Gradient matching image.png */}
        <span
          className={`font-black uppercase tracking-tight ${current.text} bg-gradient-to-r from-[#2B59C3] via-[#0284C7] to-[#06B6D4] bg-clip-text text-transparent`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          TALK
        </span>

        {/* The 'Ê' with Coral/Sunset Accent Speech Bubble Circumflex */}
        <span className={`relative font-black uppercase tracking-tight ${current.text} text-[#06B6D4]`}>
          E
          {/* Circumflex Speech Bubble accent */}
          <span
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(249, 115, 22, 0.25))',
            }}
          >
            {/* Top Chevron */}
            <svg
              className="w-2.5 h-2 -mb-0.5"
              viewBox="0 0 16 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 0.5L15 8L13 9.5L8 4L3 9.5L1 8L8 0.5Z"
                fill="url(#coralChevronGrad)"
              />
              <defs>
                <linearGradient id="coralChevronGrad" x1="1" y1="9.5" x2="15" y2="0.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB923C" />
                  <stop offset="1" stopColor="#F97316" />
                </linearGradient>
              </defs>
            </svg>
            {/* Coral Speech Bubble */}
            <div className="w-3.5 h-2.5 rounded-full bg-gradient-to-r from-[#FB7185] via-[#FB923C] to-[#F97316] relative flex items-center justify-center shadow-xs">
              <div className="absolute -bottom-0.5 left-1.5 w-1 h-1 bg-[#FB7185] rotate-45 transform" />
            </div>
          </span>
        </span>
      </div>

      {/* Subtitle — English — */}
      {showSubtitle && (
        <div className="flex items-center gap-1.5 text-neutral-400 font-medium tracking-widest mt-0.5">
          <span className="w-2.5 h-[1px] bg-gradient-to-r from-transparent to-[#0284C7]/50" />
          <span className={`${current.sub} text-[#0284C7] font-semibold tracking-wider`}>
            English
          </span>
          <span className="w-2.5 h-[1px] bg-gradient-to-l from-transparent to-[#F97316]/50" />
        </div>
      )}
    </div>
  );
};
