import React from 'react';

interface OfficialRaffaEmblemProps {
  className?: string;
}

/**
 * Exact vector replication of the official RAFFA ALIADOS DO CAMPO emblem (IMG-20260423-WA0024.jpg)
 * Featuring the 3-leaf sprout with white veins, the two-tone handshake with 4 fingers and cuff stripes,
 * and the arched "RAFFA ALIADOS DO CAMPO" text.
 */
export const OfficialRaffaEmblem: React.FC<OfficialRaffaEmblemProps> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. TOP SPROUT WITH 3 LEAVES & WHITE VEINS */}
      <g id="sprout-plant">
        {/* Main curved stems */}
        <path
          d="M256 220 C256 185 240 145 190 140 M256 195 C256 160 250 115 258 80 M256 190 C256 155 285 135 345 140"
          stroke="#176B38"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Left Leaf (Angled left ~-35°) */}
        <g transform="translate(165, 125) rotate(-35)">
          <path
            d="M-75 0 C-75 -36 0 -52 75 0 C0 52 -75 36 -75 0 Z"
            fill="#176B38"
          />
          {/* White Central Vein */}
          <path
            d="M-70 0 L68 0"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Side Veins */}
          <path
            d="M-35 0 L-15 -18 M-10 0 L10 -20 M15 0 L35 -18 M-35 0 L-15 18 M-10 0 L10 20 M15 0 L35 18"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>

        {/* Center / Top Leaf (Angled ~-10°) */}
        <g transform="translate(262, 95) rotate(-12)">
          <path
            d="M-60 0 C-60 -30 0 -42 60 0 C0 42 -60 30 -60 0 Z"
            fill="#176B38"
          />
          {/* White Central Vein */}
          <path
            d="M-55 0 L54 0"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Side Veins */}
          <path
            d="M-28 0 L-12 -15 M-8 0 L8 -16 M12 0 L28 -14 M-28 0 L-12 15 M-8 0 L8 16 M12 0 L28 14"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>

        {/* Right Leaf (Angled right ~+28°) */}
        <g transform="translate(345, 125) rotate(28)">
          <path
            d="M-75 0 C-75 -36 0 -52 75 0 C0 52 -75 36 -75 0 Z"
            fill="#176B38"
          />
          {/* White Central Vein */}
          <path
            d="M-68 0 L70 0"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Side Veins */}
          <path
            d="M-35 0 L-15 -18 M-10 0 L10 -20 M15 0 L35 -18 M-35 0 L-15 18 M-10 0 L10 20 M15 0 L35 18"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* 2. HANDSHAKE (LIGHT GREEN LEFT HAND + DARK GREEN RIGHT HAND) */}
      <g id="handshake">
        
        {/* Left Hand (Light Grass Green #78B548) Body & Palm */}
        <path
          d="M 125 210
             L 98 270
             L 165 315
             L 272 388
             C 278 392 288 388 290 380
             L 345 342
             L 345 320
             L 240 220
             C 220 230 190 235 170 230
             Z"
          fill="#78B548"
        />

        {/* Right Hand (Dark Forest Green #176B38) Sleeve & Thumb */}
        <path
          d="M 380 210
             L 410 270
             L 348 322
             L 290 262
             C 275 248 248 240 226 248
             C 214 252 205 264 205 278
             C 205 292 215 304 235 304
             L 275 290
             L 345 345
             L 355 330
             L 285 240
             Z"
          fill="#176B38"
        />

        {/* Right Sleeve Main Body */}
        <path
          d="M 285 220
             L 380 210
             L 410 270
             L 348 322
             L 280 255
             C 260 238 235 242 222 250
             C 210 258 206 270 206 280
             C 206 295 218 303 234 303
             L 278 290
             L 346 344
             L 345 320
             L 282 245
             Z"
          fill="#176B38"
        />

        {/* Exact Handshake Clasp Shape Layer */}
        {/* Right Hand Clasp: Sleeve + Palm + Thumb coming over */}
        <path
          d="M 285 220
             L 385 208
             L 410 274
             L 348 322
             L 295 268
             C 278 250 248 244 228 254
             C 212 262 205 276 206 288
             C 207 302 220 310 236 308
             L 272 296
             C 278 294 284 298 286 304
             L 345 352
             L 348 324
             L 280 248
             C 265 235 240 232 226 242
             Z"
          fill="#176B38"
        />

        {/* Two White Diagonal Stripes on the Right Sleeve Cuff */}
        <line
          x1="352"
          y1="250"
          x2="378"
          y2="235"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="360"
          y1="262"
          x2="386"
          y2="247"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* White outline defining the Right Hand's Thumb */}
        <path
          d="M 282 245 C 260 230 232 238 218 250 C 205 262 204 278 206 288 C 208 300 220 308 236 306 L 274 294"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Left Hand's 4 Pill-shaped Fingers grasping from bottom-left (Dark Green / Light Green contrast) */}
        <g id="fingers">
          {/* Finger 1 (Index) */}
          <rect
            x="166"
            y="300"
            width="25"
            height="56"
            rx="12.5"
            transform="rotate(-36 166 300)"
            fill="#176B38"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          {/* Finger 2 (Middle) */}
          <rect
            x="192"
            y="308"
            width="25"
            height="58"
            rx="12.5"
            transform="rotate(-36 192 308)"
            fill="#176B38"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          {/* Finger 3 (Ring) */}
          <rect
            x="218"
            y="316"
            width="25"
            height="60"
            rx="12.5"
            transform="rotate(-36 218 316)"
            fill="#176B38"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          {/* Finger 4 (Pinky) */}
          <rect
            x="244"
            y="324"
            width="25"
            height="62"
            rx="12.5"
            transform="rotate(-36 244 324)"
            fill="#176B38"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
        </g>

        {/* White separation lines on the palm of the light green hand */}
        <line
          x1="272"
          y1="298"
          x2="330"
          y2="348"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="250"
          y1="318"
          x2="310"
          y2="368"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="230"
          y1="340"
          x2="280"
          y2="382"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* 3. CURVED BOTTOM TEXT: "RAFFA ALIADOS DO CAMPO" */}
      <path
        id="raffaCurvedTextPath"
        d="M 60 280 A 205 205 0 0 0 440 280"
        fill="none"
      />
      <text
        fill="#176B38"
        fontSize="34"
        fontWeight="900"
        letterSpacing="0.08em"
        fontFamily="'Outfit', 'Plus Jakarta Sans', sans-serif"
      >
        <textPath
          href="#raffaCurvedTextPath"
          startOffset="50%"
          textAnchor="middle"
        >
          RAFFA ALIADOS DO CAMPO
        </textPath>
      </text>
    </svg>
  );
};
