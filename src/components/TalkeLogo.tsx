import React from 'react';

interface TalkeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  variant?: 'horizontal' | 'card' | 'icon';
  className?: string;
}

export const TalkeLogo: React.FC<TalkeLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'horizontal',
  className = '',
}) => {
  // Height / Width dimensions based on size
  const dimensions = {
    xs: { h: 26, card: 'w-7 h-7' },
    sm: { h: 34, card: 'w-9 h-9' },
    md: { h: 44, card: 'w-12 h-12' },
    lg: { h: 58, card: 'w-16 h-16' },
    xl: { h: 80, card: 'w-24 h-24' },
    '2xl': { h: 104, card: 'w-32 h-32' },
  }[size] || { h: 44, card: 'w-12 h-12' };

  // Icon only mode (the rounded Ê with speech bubble and circumflex)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="340 135 85 185"
          className={dimensions.card}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iconLetterEGrad" x1="358" y1="260" x2="410" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#37A9DA" />
              <stop offset="100%" stopColor="#36C3DF" />
            </linearGradient>
            <linearGradient id="iconSpeechGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F85175" />
              <stop offset="100%" stopColor="#FB8E5B" />
            </linearGradient>
            <linearGradient id="iconChevronGrad" x1="0" y1="1" x2="0.5" y2="0">
              <stop offset="0%" stopColor="#F76E4B" />
              <stop offset="100%" stopColor="#FB9F68" />
            </linearGradient>
          </defs>

          {/* Letter E */}
          <g stroke="url(#iconLetterEGrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
            <line x1="358" y1="220" x2="358" y2="306" />
            <line x1="358" y1="220" x2="406" y2="220" />
            <line x1="358" y1="263" x2="398" y2="263" />
            <line x1="358" y1="306" x2="406" y2="306" />
          </g>

          {/* Circumflex Roof (^) */}
          <path
            d="M 368 174 L 388 150 L 408 174"
            stroke="url(#iconChevronGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Speech Bubble */}
          <path
            d="M 364 186
               C 364 178 372 172 388 172
               C 404 172 414 178 414 186
               C 414 194 404 200 388 200
               C 382 200 376 199 372 197
               L 366 205
               C 365 206 364 205 364 204
               L 365 195
               C 364.5 193 364 189 364 186 Z"
            fill="url(#iconSpeechGrad)"
          />
        </svg>
      </div>
    );
  }

  // Exact Square Card variant (reproduces the user's uploaded image.png pixel-perfect)
  if (variant === 'card') {
    return (
      <div
        className={`inline-flex items-center justify-center select-none rounded-2xl overflow-hidden shadow-xs border border-blue-100/60 ${dimensions.card} ${className}`}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="cardBgGlow" cx="50%" cy="48%" r="55%" fx="50%" fy="48%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#F9FBFE" />
              <stop offset="100%" stopColor="#EFF6FD" />
            </radialGradient>
            <linearGradient id="cardTalkeGrad" x1="46" y1="260" x2="410" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2D5CA7" />
              <stop offset="22%" stopColor="#3273BF" />
              <stop offset="48%" stopColor="#368DCB" />
              <stop offset="76%" stopColor="#37A9DA" />
              <stop offset="100%" stopColor="#36C3DF" />
            </linearGradient>
            <linearGradient id="cardBubbleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F85175" />
              <stop offset="50%" stopColor="#FA6D79" />
              <stop offset="100%" stopColor="#FB8E5B" />
            </linearGradient>
            <linearGradient id="cardChevronGrad" x1="0" y1="1" x2="0.5" y2="0">
              <stop offset="0%" stopColor="#F76E4B" />
              <stop offset="100%" stopColor="#FB9F68" />
            </linearGradient>
            <filter id="cardSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#F96350" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background */}
          <rect width="500" height="500" fill="url(#cardBgGlow)" />

          {/* Letters TALKÊ */}
          <g stroke="url(#cardTalkeGrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
            {/* T */}
            <line x1="46" y1="220" x2="114" y2="220" />
            <line x1="80" y1="220" x2="80" y2="306" />

            {/* A */}
            <path d="M 124 306 L 148 226 Q 153 211 159 226 L 183 306" />

            {/* L */}
            <path d="M 212 220 L 212 296 Q 212 306 222 306 L 254 306" />

            {/* K */}
            <line x1="282" y1="220" x2="282" y2="306" />
            <line x1="284" y1="266" x2="326" y2="220" />
            <line x1="298" y1="260" x2="330" y2="306" />

            {/* E */}
            <line x1="358" y1="220" x2="358" y2="306" />
            <line x1="358" y1="220" x2="406" y2="220" />
            <line x1="358" y1="263" x2="398" y2="263" />
            <line x1="358" y1="306" x2="406" y2="306" />
          </g>

          {/* Speech Bubble & Roof Accent on 'E' */}
          <g filter="url(#cardSoftShadow)">
            <path
              d="M 368 174 L 388 150 L 408 174"
              stroke="url(#cardChevronGrad)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 364 186
                 C 364 178 372 172 388 172
                 C 404 172 414 178 414 186
                 C 414 194 404 200 388 200
                 C 382 200 376 199 372 197
                 L 366 205
                 C 365 206 364 205 364 204
                 L 365 195
                 C 364.5 193 364 189 364 186 Z"
              fill="url(#cardBubbleGrad)"
            />
          </g>

          {/* Subtitle: — English — */}
          <line x1="112" y1="360" x2="162" y2="360" stroke="#48C3DE" strokeWidth="2.5" strokeLinecap="round" />
          <text
            x="236"
            y="368"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontSize="33"
            fontWeight="500"
            letterSpacing="4px"
            fill="#20395D"
            textAnchor="middle"
          >
            English
          </text>
          <line x1="310" y1="360" x2="360" y2="360" stroke="#FBA07B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Full Horizontal Vector Logo (identical to image.png, responsive & crisp)
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox={showSubtitle ? '30 135 395 245' : '30 135 395 190'}
        style={{ height: `${dimensions.h}px`, width: 'auto' }}
        className="overflow-visible max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main TALKÊ letters gradient from royal ocean blue to turquoise cyan */}
          <linearGradient id="talkeGradHorizontal" x1="46" y1="260" x2="410" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2D5CA7" />
            <stop offset="22%" stopColor="#3273BF" />
            <stop offset="48%" stopColor="#368DCB" />
            <stop offset="76%" stopColor="#37A9DA" />
            <stop offset="100%" stopColor="#36C3DF" />
          </linearGradient>

          {/* Speech bubble gradient (coral-red to orange-peach) */}
          <linearGradient id="bubbleGradHorizontal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F85175" />
            <stop offset="50%" stopColor="#FA6D79" />
            <stop offset="100%" stopColor="#FB8E5B" />
          </linearGradient>

          {/* Circumflex chevron gradient */}
          <linearGradient id="chevronGradHorizontal" x1="0" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#F76E4B" />
            <stop offset="100%" stopColor="#FB9F68" />
          </linearGradient>

          {/* Soft shadow for speech bubble & circumflex */}
          <filter id="softGlowHorizontal" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F96350" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* ================= TALKÊ Letters ================= */}
        <g
          fill="none"
          stroke="url(#talkeGradHorizontal)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* T */}
          <line x1="46" y1="220" x2="114" y2="220" />
          <line x1="80" y1="220" x2="80" y2="306" />

          {/* A (no crossbar - stylized apex arch) */}
          <path d="M 124 306 L 148 226 Q 153 211 159 226 L 183 306" />

          {/* L */}
          <path d="M 212 220 L 212 296 Q 212 306 222 306 L 254 306" />

          {/* K */}
          <line x1="282" y1="220" x2="282" y2="306" />
          <line x1="284" y1="266" x2="326" y2="220" />
          <line x1="298" y1="260" x2="330" y2="306" />

          {/* E */}
          <line x1="358" y1="220" x2="358" y2="306" />
          <line x1="358" y1="220" x2="406" y2="220" />
          <line x1="358" y1="263" x2="398" y2="263" />
          <line x1="358" y1="306" x2="406" y2="306" />
        </g>

        {/* ================= Speech Bubble & Circumflex on 'E' ================= */}
        <g filter="url(#softGlowHorizontal)">
          {/* Circumflex Chevron Roof (^) */}
          <path
            d="M 368 174 L 388 150 L 408 174"
            fill="none"
            stroke="url(#chevronGradHorizontal)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Speech Bubble Body */}
          <path
            d="M 364 186
               C 364 178 372 172 388 172
               C 404 172 414 178 414 186
               C 414 194 404 200 388 200
               C 382 200 376 199 372 197
               L 366 205
               C 365 206 364 205 364 204
               L 365 195
               C 364.5 193 364 189 364 186 Z"
            fill="url(#bubbleGradHorizontal)"
          />
        </g>

        {/* ================= Subtitle: — English — ================= */}
        {showSubtitle && (
          <g>
            {/* Left cyan line */}
            <line x1="112" y1="360" x2="162" y2="360" stroke="#48C3DE" strokeWidth="2.5" strokeLinecap="round" />

            {/* "English" word in dark indigo sans */}
            <text
              x="236"
              y="368"
              fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontSize="33"
              fontWeight="500"
              letterSpacing="4px"
              fill="#20395D"
              textAnchor="middle"
            >
              English
            </text>

            {/* Right coral-peach line */}
            <line x1="310" y1="360" x2="360" y2="360" stroke="#FBA07B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
