/**
 * KenscoffMountains - the hero ridge.
 *
 * Referenced in PRD section 5 as the visual anchor for the Mountain Grey
 * identity and reused as the wide-format website hero (section 6). Drawn as
 * inline SVG rather than an image: it is roughly two kilobytes, scales to any
 * width, and costs no extra network request, which matters on the connections
 * this product is designed for.
 *
 * The sky gradient is aligned to background_primary as the PRD specifies. The
 * ridge gradients are the hand-tuned artwork flagged there as a follow-up, so
 * they are kept as named constants here rather than being forced onto tokens.
 */
const RIDGE_FAR = '#8A857C';
const RIDGE_MID = '#6E6A63';
const RIDGE_NEAR = '#4F4B45';

export default function MountainRidge({ height = 260, className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: 'block', width: '100%', height }}
      role="img"
      aria-label="Layered mountain ridges at dawn"
    >
      <defs>
        <linearGradient id="cwl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1E6D3" />
          <stop offset="100%" stopColor="#D8B98C" />
        </linearGradient>
      </defs>

      <rect width="1440" height="320" fill="url(#cwl-sky)" />
      <circle cx="1150" cy="92" r="34" fill="#FBF7F0" opacity="0.85" />

      <path
        d="M0 210 L150 150 L280 196 L420 118 L560 186 L700 132 L860 200 L1010 150 L1180 205 L1320 162 L1440 208 L1440 320 L0 320 Z"
        fill={RIDGE_FAR}
        opacity="0.55"
      />
      <path
        d="M0 250 L130 196 L270 240 L410 172 L570 232 L720 186 L880 244 L1040 198 L1200 248 L1340 210 L1440 246 L1440 320 L0 320 Z"
        fill={RIDGE_MID}
        opacity="0.75"
      />
      <path
        d="M0 288 L160 244 L320 282 L480 232 L640 280 L800 240 L960 286 L1120 246 L1280 288 L1440 254 L1440 320 L0 320 Z"
        fill={RIDGE_NEAR}
      />
    </svg>
  );
}
