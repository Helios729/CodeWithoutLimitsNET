import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';

/**
 * The welcome-screen ridge illustration named in PRD section 5 as this app's
 * visual anchor. Shared shape with the website hero so the two products read as
 * one thing.
 *
 * The sky gradient is aligned to background_primary as the PRD requires. The
 * ridge gradients remain hand-tuned artwork, flagged there as a follow-up
 * rather than a token-level change, so they stay as named constants here.
 */
const RIDGE_FAR = '#8A857C';
const RIDGE_MID = '#6E6A63';
const RIDGE_NEAR = '#4F4B45';

export default function KenscoffMountains({ width = 400, height = 180 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F1E6D3" />
          <Stop offset="1" stopColor="#D8B98C" />
        </LinearGradient>
      </Defs>
      <Rect width="1440" height="320" fill="url(#sky)" />
      <Circle cx="1150" cy="92" r="34" fill="#FBF7F0" opacity="0.85" />
      <Path
        d="M0 210 L150 150 L280 196 L420 118 L560 186 L700 132 L860 200 L1010 150 L1180 205 L1320 162 L1440 208 L1440 320 L0 320 Z"
        fill={RIDGE_FAR}
        opacity="0.55"
      />
      <Path
        d="M0 250 L130 196 L270 240 L410 172 L570 232 L720 186 L880 244 L1040 198 L1200 248 L1340 210 L1440 246 L1440 320 L0 320 Z"
        fill={RIDGE_MID}
        opacity="0.75"
      />
      <Path
        d="M0 288 L160 244 L320 282 L480 232 L640 280 L800 240 L960 286 L1120 246 L1280 288 L1440 254 L1440 320 L0 320 Z"
        fill={RIDGE_NEAR}
      />
    </Svg>
  );
}
