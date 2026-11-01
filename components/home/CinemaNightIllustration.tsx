interface CinemaNightIllustrationProps {
  className?: string;
}

export default function CinemaNightIllustration({
  className = "",
}: CinemaNightIllustrationProps) {
  return (
    <svg
      viewBox="0 0 600 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="cinema-night-title cinema-night-description"
      className={className}
    >
      <title id="cinema-night-title">
        A moviegoer relaxing in a cinema seat with popcorn and a ticket
      </title>
      <desc id="cinema-night-description">
        A stylized illustration of a stylish person wearing sunglasses, sitting
        in a plush cinema seat with a bucket of popcorn and a movie ticket.
      </desc>

      <defs>
        <radialGradient id="cinema-halo" cx="50%" cy="44%" r="55%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#9d174d" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#08040a" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="cinema-beam"
          x1="300"
          y1="0"
          x2="300"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f9a8d4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f9a8d4" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="cinema-seat-back"
          x1="170"
          y1="180"
          x2="440"
          y2="520"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4b1238" />
          <stop offset="0.55" stopColor="#2b0a21" />
          <stop offset="1" stopColor="#13040f" />
        </linearGradient>
        <linearGradient
          id="cinema-seat-cushion"
          x1="140"
          y1="430"
          x2="460"
          y2="545"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5b1744" />
          <stop offset="1" stopColor="#1d0715" />
        </linearGradient>
        <linearGradient
          id="cinema-seat-arm"
          x1="120"
          y1="370"
          x2="180"
          y2="540"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3d0d2d" />
          <stop offset="1" stopColor="#160510" />
        </linearGradient>
        <linearGradient
          id="cinema-hair"
          x1="270"
          y1="180"
          x2="340"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#42122f" />
          <stop offset="1" stopColor="#12060f" />
        </linearGradient>
        <linearGradient
          id="cinema-skin"
          x1="280"
          y1="205"
          x2="328"
          y2="292"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f8c9ab" />
          <stop offset="1" stopColor="#d88b73" />
        </linearGradient>
        <linearGradient
          id="cinema-jacket"
          x1="240"
          y1="310"
          x2="370"
          y2="460"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fb4d7d" />
          <stop offset="0.52" stopColor="#d71f5b" />
          <stop offset="1" stopColor="#8d0f38" />
        </linearGradient>
        <linearGradient
          id="cinema-sleeve"
          x1="230"
          y1="330"
          x2="250"
          y2="440"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ef3b6c" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient
          id="cinema-ticket"
          x1="376"
          y1="268"
          x2="476"
          y2="322"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fecdd3" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient
          id="cinema-bucket"
          x1="250"
          y1="405"
          x2="310"
          y2="492"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
        <clipPath id="cinema-bucket-clip">
          <path d="M236 402H326L311 494H251L236 402Z" />
        </clipPath>
      </defs>

      <circle cx="300" cy="290" r="255" fill="url(#cinema-halo)" />
      <path d="M248 0H386L514 440H118L248 0Z" fill="url(#cinema-beam)" />
      <ellipse cx="300" cy="562" rx="214" ry="38" fill="#000000" opacity="0.55" />

      <g opacity="0.45">
        <circle cx="116" cy="150" r="6" fill="#f9a8d4" />
        <circle cx="482" cy="246" r="5" fill="#f472b6" />
        <circle cx="524" cy="420" r="8" fill="#fb7185" opacity="0.6" />
        <circle cx="92" cy="392" r="4" fill="#fbcfe8" />
        <circle cx="458" cy="88" r="4" fill="#fda4af" />
      </g>

      <g transform="rotate(-14 486 118)" opacity="0.5">
        <rect
          x="408"
          y="76"
          width="188"
          height="66"
          rx="12"
          fill="#140611"
          stroke="#fb7185"
          strokeOpacity="0.28"
        />
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <g key={index}>
            <rect
              x={420 + index * 30}
              y="82"
              width="10"
              height="7"
              rx="2"
              fill="#f9a8d4"
              opacity="0.4"
            />
            <rect
              x={420 + index * 30}
              y="129"
              width="10"
              height="7"
              rx="2"
              fill="#f9a8d4"
              opacity="0.4"
            />
            <rect
              x={418 + index * 30}
              y="94"
              width="20"
              height="30"
              rx="4"
              fill="#4a1238"
            />
          </g>
        ))}
      </g>

      <rect
        x="198"
        y="142"
        width="204"
        height="180"
        rx="86"
        fill="#2e0b23"
        stroke="#f472b6"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <rect
        x="150"
        y="184"
        width="300"
        height="312"
        rx="114"
        fill="url(#cinema-seat-back)"
        stroke="#f472b6"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <rect
        x="168"
        y="204"
        width="264"
        height="272"
        rx="98"
        stroke="#fb7185"
        strokeOpacity="0.1"
        strokeWidth="2"
      />
      <path
        d="M196 240C226 210 260 198 300 198"
        stroke="#fda4af"
        strokeOpacity="0.2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="120"
        y="432"
        width="360"
        height="126"
        rx="63"
        fill="url(#cinema-seat-cushion)"
        stroke="#f472b6"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <path
        d="M172 476C232 458 368 458 428 476"
        stroke="#fb7185"
        strokeOpacity="0.2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="98"
        y="366"
        width="88"
        height="172"
        rx="44"
        fill="url(#cinema-seat-arm)"
        stroke="#f472b6"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <rect
        x="414"
        y="366"
        width="88"
        height="172"
        rx="44"
        fill="url(#cinema-seat-arm)"
        stroke="#f472b6"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <ellipse
        cx="458"
        cy="392"
        rx="20"
        ry="8"
        fill="#12040d"
        stroke="#f472b6"
        strokeOpacity="0.24"
      />

      <path
        d="M286 292H326V330H286V292Z"
        fill="url(#cinema-skin)"
      />
      <path
        d="M252 252C246 200 270 172 304 172C344 172 360 202 354 250C352 282 342 304 324 314C334 286 334 258 326 238C306 254 282 258 264 248C260 272 260 292 268 312C250 302 246 278 252 252Z"
        fill="url(#cinema-hair)"
      />
      <circle cx="267" cy="250" r="9" fill="url(#cinema-skin)" />
      <circle cx="343" cy="250" r="9" fill="url(#cinema-skin)" />
      <path
        d="M271 242C271 216 284 200 305 200C329 200 343 218 342 246C341 274 328 292 306 292C283 292 271 272 271 242Z"
        fill="url(#cinema-skin)"
      />
      <path
        d="M270 238C272 212 286 196 308 197C327 198 339 210 343 229C332 218 318 214 306 220C292 227 280 236 270 238Z"
        fill="url(#cinema-hair)"
      />

      <g>
        <rect
          x="278"
          y="238"
          width="28"
          height="20"
          rx="8"
          fill="#150b17"
        />
        <rect
          x="312"
          y="238"
          width="28"
          height="20"
          rx="8"
          fill="#150b17"
        />
        <path
          d="M306 245C307.5 242.5 310.5 242.5 312 245"
          stroke="#150b17"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M278 242L268 245"
          stroke="#150b17"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M340 242L350 245"
          stroke="#150b17"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M284 243L295 241"
          stroke="#f9a8d4"
          strokeOpacity="0.65"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M318 243L329 241"
          stroke="#f9a8d4"
          strokeOpacity="0.65"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      <path
        d="M307 258C306 264 303 267 307 269"
        stroke="#b96b5a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M298 278C303 282 311 282 316 278"
        stroke="#a3474f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="268" cy="262" r="3" fill="#f9a8d4" />
      <circle cx="342" cy="262" r="3" fill="#f9a8d4" />

      <path
        d="M271 303C247 312 230 333 223 366L215 448C214 456 220 462 228 462H382C390 462 396 456 395 448L387 366C380 333 361 312 339 303C330 320 280 320 271 303Z"
        fill="url(#cinema-jacket)"
      />
      <path
        d="M270 303L286 318L290 336L273 320L270 303Z"
        fill="#9f1239"
      />
      <path
        d="M340 303L324 318L320 336L337 320L340 303Z"
        fill="#9f1239"
      />
      <path
        d="M289 317L305 352L321 317C314 326 296 326 289 317Z"
        fill="#f5c8b7"
      />
      <path
        d="M306 337V458"
        stroke="#fecdd3"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <path
        d="M240 340C232 368 230 406 233 442"
        stroke="#7f0d32"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M371 340C379 368 381 406 378 442"
        stroke="#7f0d32"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M340 306C366 316 383 340 391 372"
        stroke="#f9a8d4"
        strokeOpacity="0.32"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M248 330C224 354 214 390 228 420"
        stroke="url(#cinema-sleeve)"
        strokeWidth="46"
        strokeLinecap="round"
      />
      <path
        d="M221 410L236 427"
        stroke="#5f0b2b"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M348 330C378 345 398 374 405 402"
        stroke="url(#cinema-sleeve)"
        strokeWidth="44"
        strokeLinecap="round"
      />
      <path
        d="M405 402C411 382 418 359 422 344"
        stroke="url(#cinema-sleeve)"
        strokeWidth="36"
        strokeLinecap="round"
      />
      <path
        d="M416 352L426 340"
        stroke="#5f0b2b"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <path
        d="M236 402H326L311 494H251L236 402Z"
        fill="url(#cinema-bucket)"
        stroke="#fb7185"
        strokeOpacity="0.7"
        strokeWidth="1.5"
      />
      <g clipPath="url(#cinema-bucket-clip)">
        <path
          d="M258 404L266 492"
          stroke="#ffe4e6"
          strokeWidth="10"
          opacity="0.8"
        />
        <path
          d="M282 402V494"
          stroke="#ffe4e6"
          strokeWidth="10"
          opacity="0.8"
        />
        <path
          d="M306 404L298 492"
          stroke="#ffe4e6"
          strokeWidth="10"
          opacity="0.8"
        />
      </g>
      <g>
        <circle cx="246" cy="400" r="11" fill="#fde68a" />
        <circle cx="259" cy="388" r="12" fill="#fcd34d" />
        <circle cx="274" cy="384" r="13" fill="#fef3c7" />
        <circle cx="290" cy="389" r="12" fill="#fbbf24" />
        <circle cx="304" cy="383" r="13" fill="#fde68a" />
        <circle cx="318" cy="391" r="11" fill="#fcd34d" />
        <circle cx="327" cy="401" r="9" fill="#fef3c7" />
        <circle cx="262" cy="382" r="8" fill="#fff7ed" />
        <circle cx="298" cy="378" r="8" fill="#fff7ed" />
      </g>
      <ellipse cx="281" cy="402" rx="45" ry="12" fill="#f43f5e" />
      <ellipse cx="281" cy="402" rx="36" ry="8" fill="#9f1239" opacity="0.55" />
      <path
        d="M243 398C253 393 270 390 281 390"
        stroke="#fecdd3"
        strokeOpacity="0.65"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <g transform="rotate(-14 426 300)">
        <rect
          x="372"
          y="268"
          width="112"
          height="54"
          rx="10"
          fill="url(#cinema-ticket)"
          stroke="#fda4af"
          strokeOpacity="0.85"
        />
        <path
          d="M404 268V322"
          stroke="#be123c"
          strokeOpacity="0.35"
          strokeDasharray="3 4"
        />
        <text
          x="390"
          y="293"
          fill="#7f1d3a"
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
          fontSize="8"
          fontWeight="800"
          letterSpacing="1.8"
        >
          ADMIT ONE
        </text>
        <text
          x="390"
          y="307"
          fill="#9f1239"
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
          fontSize="6"
          fontWeight="700"
          letterSpacing="1.2"
        >
          SPOT TICKET
        </text>
        <path
          d="M449 285L451 290L456 292L451 294L449 299L447 294L442 292L447 290L449 285Z"
          fill="#9f1239"
        />
      </g>

      <ellipse
        cx="244"
        cy="432"
        rx="14"
        ry="11"
        fill="url(#cinema-skin)"
        transform="rotate(-20 244 432)"
      />
      <ellipse
        cx="425"
        cy="337"
        rx="14"
        ry="11"
        fill="url(#cinema-skin)"
        transform="rotate(18 425 337)"
      />

      <g fill="#f9a8d4">
        <path
          d="M374 236L378 246L388 250L378 254L374 264L370 254L360 250L370 246L374 236Z"
          opacity="0.8"
        />
        <path
          d="M486 332L488.5 339L496 342L488.5 345L486 352L483.5 345L476 342L483.5 339L486 332Z"
          opacity="0.55"
        />
        <path
          d="M148 282L151 290L159 293L151 296L148 304L145 296L137 293L145 290L148 282Z"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}
