import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';

export type SuitType =
  // Standard suits (Rami)
  | 'spades'
  | 'hearts'
  | 'diamonds'
  | 'clubs'
  // Tunisian Chkobba suits
  | 'dineri'
  | 'coupe'
  | 'bastoni'
  | 'spade';

interface IconProps {
  size?: number;
  color?: string;
}

/** Standard Spades (♠) */
export const SpadesIcon: React.FC<IconProps> = ({ size = 24, color = '#1C1917' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 8 C40 32 15 48 15 65 C15 76 24 84 35 84 C43 84 48 78 50 72 C52 78 57 84 65 84 C76 84 85 76 85 65 C85 48 60 32 50 8 Z"
      fill={color}
    />
    <Path
      d="M47 70 L43 92 C43 94 45 96 48 96 L52 96 C55 96 57 94 57 92 L53 70 Z"
      fill={color}
    />
  </Svg>
);

/** Standard Hearts (♥) */
export const HeartsIcon: React.FC<IconProps> = ({ size = 24, color = '#C5221F' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 88 C45 84 10 58 10 35 C10 18 24 10 36 10 C44 10 48 15 50 20 C52 15 56 10 64 10 C76 10 90 18 90 35 C90 58 55 84 50 88 Z"
      fill={color}
    />
  </Svg>
);

/** Standard Diamonds (♦) */
export const DiamondsIcon: React.FC<IconProps> = ({ size = 24, color = '#C5221F' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="50,10 85,50 50,90 15,50" fill={color} />
  </Svg>
);

/** Standard Clubs (♣) */
export const ClubsIcon: React.FC<IconProps> = ({ size = 24, color = '#1C1917' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="30" r="18" fill={color} />
    <Circle cx="32" cy="58" r="18" fill={color} />
    <Circle cx="68" cy="58" r="18" fill={color} />
    <Circle cx="50" cy="50" r="14" fill={color} />
    <Path
      d="M47 55 L42 90 C42 93 45 95 49 95 L51 95 C55 95 58 93 58 90 L53 55 Z"
      fill={color}
    />
  </Svg>
);

/** Tunisian Chkobba: Dineri (Denari / Golden Coin) */
export const DineriIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="goldCoin" cx="40%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FFF2A3" />
        <Stop offset="45%" stopColor="#E5B842" />
        <Stop offset="85%" stopColor="#C69214" />
        <Stop offset="100%" stopColor="#8A5E04" />
      </RadialGradient>
      <RadialGradient id="innerGem" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#D43F3A" />
        <Stop offset="100%" stopColor="#7F1D1D" />
      </RadialGradient>
    </Defs>
    {/* Outer Coin rim */}
    <Circle cx="50" cy="50" r="46" fill="url(#goldCoin)" stroke="#8A5E04" strokeWidth="3" />
    <Circle cx="50" cy="50" r="40" fill="none" stroke="#FFF5B8" strokeWidth="2" strokeDasharray="3,3" />
    {/* Concentric carved rings */}
    <Circle cx="50" cy="50" r="32" fill="#E5B842" stroke="#8A5E04" strokeWidth="2" />
    {/* 8-pointed Islamic/Tunisian rosette star */}
    <Path
      d="M50 22 L55 36 L69 31 L64 45 L78 50 L64 55 L69 69 L55 64 L50 78 L45 64 L31 69 L36 55 L22 50 L36 45 L31 31 L45 36 Z"
      fill="#F9D463"
      stroke="#7F5202"
      strokeWidth="1.5"
    />
    <Circle cx="50" cy="50" r="10" fill="url(#innerGem)" stroke="#FFE28A" strokeWidth="1.5" />
    <Circle cx="48" cy="48" r="3" fill="#FFE599" opacity={0.8} />
  </Svg>
);

/** Tunisian Chkobba: Coupe (Chalice / Coppe) */
export const CoupeIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="chaliceGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#9E730E" />
        <Stop offset="30%" stopColor="#FAD865" />
        <Stop offset="70%" stopColor="#E3B23C" />
        <Stop offset="100%" stopColor="#8B6009" />
      </LinearGradient>
    </Defs>
    {/* Goblet Cup Bowl */}
    <Path
      d="M26 14 C26 44 40 56 46 60 L46 76 L32 82 L32 88 L68 88 L68 82 L54 76 L54 60 C60 56 74 44 74 14 Z"
      fill="url(#chaliceGold)"
      stroke="#6E4A05"
      strokeWidth="2.5"
    />
    {/* Cup Rim */}
    <Rect x="22" y="10" width="56" height="8" rx="4" fill="#FFE685" stroke="#7A5205" strokeWidth="2" />
    {/* Handles */}
    <Path
      d="M23 24 C10 24 10 44 26 48"
      fill="none"
      stroke="#E5B842"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Path
      d="M77 24 C90 24 90 44 74 48"
      fill="none"
      stroke="#E5B842"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Decorative jewel */}
    <Circle cx="50" cy="34" r="6" fill="#C5221F" stroke="#FFE79A" strokeWidth="1.5" />
  </Svg>
);

/** Tunisian Chkobba: Bastoni (Staff / Clubs) */
export const BastoniIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5A3219" />
        <Stop offset="50%" stopColor="#824C27" />
        <Stop offset="100%" stopColor="#3F200E" />
      </LinearGradient>
      <LinearGradient id="batonGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#B3861B" />
        <Stop offset="50%" stopColor="#F9D770" />
        <Stop offset="100%" stopColor="#9C7210" />
      </LinearGradient>
    </Defs>
    {/* Diagonal ceremonial staff */}
    <G transform="rotate(-30 50 50)">
      <Rect x="44" y="8" width="12" height="84" rx="6" fill="url(#woodGrad)" stroke="#2B150A" strokeWidth="2" />
      {/* Golden knobby bands */}
      <Rect x="42" y="18" width="16" height="7" rx="3.5" fill="url(#batonGold)" />
      <Rect x="42" y="46" width="16" height="7" rx="3.5" fill="url(#batonGold)" />
      <Rect x="42" y="74" width="16" height="7" rx="3.5" fill="url(#batonGold)" />
      {/* Top crown knob */}
      <Circle cx="50" cy="10" r="10" fill="url(#batonGold)" stroke="#6A4D07" strokeWidth="2" />
      <Circle cx="50" cy="90" r="7" fill="url(#batonGold)" stroke="#6A4D07" strokeWidth="1.5" />
    </G>
  </Svg>
);

/** Tunisian Chkobba: Spade (Curved Scimitar / Sword) */
export const TunisianSpadeIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E2E8F0" />
        <Stop offset="50%" stopColor="#CBD5E1" />
        <Stop offset="100%" stopColor="#64748B" />
      </LinearGradient>
      <LinearGradient id="hiltGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#A67B18" />
        <Stop offset="50%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#8A630E" />
      </LinearGradient>
    </Defs>
    {/* Curved oriental scimitar blade */}
    <Path
      d="M20 80 Q 40 45 72 20 Q 82 12 88 10 Q 75 28 62 55 Q 52 75 35 84 Z"
      fill="url(#bladeGrad)"
      stroke="#334155"
      strokeWidth="2"
    />
    {/* Golden crossguard */}
    <Rect x="15" y="74" width="22" height="7" rx="3.5" transform="rotate(-35 26 77)" fill="url(#hiltGold)" stroke="#78350F" strokeWidth="1.5" />
    {/* Grip */}
    <Path d="M18 84 L12 92" stroke="#5B3814" strokeWidth="6" strokeLinecap="round" />
    {/* Pommel */}
    <Circle cx="10" cy="94" r="5" fill="url(#hiltGold)" stroke="#78350F" strokeWidth="1.5" />
  </Svg>
);

/**
 * Tunisian Cultural Jack of Spades (Fante / عازف العود)
 * Inspired by the user reference: Musician in traditional red Chechia with tassel,
 * embroidered Jebba, playing an Oud (lute).
 */
export const TunisianJackIllustration: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <Svg width={width} height={height} viewBox="0 0 160 220">
    <Defs>
      <LinearGradient id="jebbaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2A3038" />
        <Stop offset="50%" stopColor="#1E232A" />
        <Stop offset="100%" stopColor="#14181D" />
      </LinearGradient>
      <LinearGradient id="oudWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E8C99B" />
        <Stop offset="50%" stopColor="#D4A373" />
        <Stop offset="100%" stopColor="#A2673B" />
      </LinearGradient>
    </Defs>

    {/* Top Musician */}
    <G transform="translate(0, 0)">
      {/* Jebba Robe body */}
      <Path
        d="M45 75 C45 55 115 55 115 75 L125 110 L35 110 Z"
        fill="url(#jebbaGrad)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      {/* Gold embroidery on chest (Farmla/Jebba trim) */}
      <Path d="M80 62 L80 110" stroke="#E5B842" strokeWidth="3" />
      <Path d="M72 75 L88 75 M70 88 L90 88 M68 102 L92 102" stroke="#E5B842" strokeWidth="2" />
      <Path d="M50 75 Q 80 85 110 75" stroke="#E5B842" strokeWidth="2" fill="none" />

      {/* Head & Neck */}
      <Rect x="73" y="46" width="14" height="18" fill="#F4D3B0" />
      <Circle cx="80" cy="38" r="16" fill="#F8DEBD" />
      {/* Hair */}
      <Path d="M66 36 C66 25 94 25 94 36 C92 40 92 44 94 46 C84 46 76 46 66 46 C68 44 68 40 66 36 Z" fill="#2D2013" />

      {/* Red Tunisian Chechia (شاشية) */}
      <Path d="M68 28 C68 18 92 18 92 28 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
      <Circle cx="80" cy="18" r="2.5" fill="#1C1917" />
      {/* Chechia Tassel (كبوس الشاشية) */}
      <Path d="M80 18 Q 94 20 96 32" stroke="#1C1917" strokeWidth="2" fill="none" />

      {/* Face features */}
      <Circle cx="76" cy="37" r="1.5" fill="#2D2013" />
      <Circle cx="85" cy="37" r="1.5" fill="#2D2013" />
      <Path d="M78 44 Q 80 47 83 44" stroke="#8A4A28" strokeWidth="1.2" fill="none" />

      {/* Tunisian Oud (Lute) */}
      <G transform="translate(10, 0)">
        {/* Oud neck & pegbox */}
        <Path d="M105 55 L125 45 L120 40 L102 52 Z" fill="#6B4226" stroke="#3A2111" strokeWidth="1" />
        {/* Oud pear-shaped body */}
        <Path
          d="M55 80 C50 65 95 65 100 85 C102 100 65 105 55 80 Z"
          fill="url(#oudWood)"
          stroke="#5C3317"
          strokeWidth="1.5"
        />
        {/* Rosette soundhole (Shamsiyya) in spade shape */}
        <Path
          d="M78 80 C74 74 68 78 68 82 C68 86 78 92 78 92 C78 92 88 86 88 82 C88 78 82 74 78 80 Z"
          fill="#3A2111"
        />
        {/* Strings */}
        <Path d="M120 43 L65 84" stroke="#FFF7ED" strokeWidth="0.8" opacity={0.8} />
        <Path d="M121 44 L67 86" stroke="#FFF7ED" strokeWidth="0.8" opacity={0.8} />
      </G>
    </G>

    {/* Center Divider Ribbon */}
    <Rect x="20" y="108" width="120" height="4" rx="2" fill="#D4AF37" />

    {/* Inverted Bottom Musician (Mirrored Traditional Court Card) */}
    <G transform="rotate(180 80 110)">
      {/* Jebba Robe body */}
      <Path
        d="M45 75 C45 55 115 55 115 75 L125 110 L35 110 Z"
        fill="url(#jebbaGrad)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      <Path d="M80 62 L80 110" stroke="#E5B842" strokeWidth="3" />
      <Path d="M72 75 L88 75 M70 88 L90 88 M68 102 L92 102" stroke="#E5B842" strokeWidth="2" />
      <Path d="M50 75 Q 80 85 110 75" stroke="#E5B842" strokeWidth="2" fill="none" />

      {/* Head & Neck */}
      <Rect x="73" y="46" width="14" height="18" fill="#F4D3B0" />
      <Circle cx="80" cy="38" r="16" fill="#F8DEBD" />
      <Path d="M66 36 C66 25 94 25 94 36 C92 40 92 44 94 46 C84 46 76 46 66 46 C68 44 68 40 66 36 Z" fill="#2D2013" />

      {/* Red Chechia */}
      <Path d="M68 28 C68 18 92 18 92 28 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
      <Circle cx="80" cy="18" r="2.5" fill="#1C1917" />
      <Path d="M80 18 Q 94 20 96 32" stroke="#1C1917" strokeWidth="2" fill="none" />

      {/* Features */}
      <Circle cx="76" cy="37" r="1.5" fill="#2D2013" />
      <Circle cx="85" cy="37" r="1.5" fill="#2D2013" />
      <Path d="M78 44 Q 80 47 83 44" stroke="#8A4A28" strokeWidth="1.2" fill="none" />

      {/* Oud */}
      <G transform="translate(10, 0)">
        <Path d="M105 55 L125 45 L120 40 L102 52 Z" fill="#6B4226" stroke="#3A2111" strokeWidth="1" />
        <Path
          d="M55 80 C50 65 95 65 100 85 C102 100 65 105 55 80 Z"
          fill="url(#oudWood)"
          stroke="#5C3317"
          strokeWidth="1.5"
        />
        <Path
          d="M78 80 C74 74 68 78 68 82 C68 86 78 92 78 92 C78 92 88 86 88 82 C88 78 82 74 78 80 Z"
          fill="#3A2111"
        />
        <Path d="M120 43 L65 84" stroke="#FFF7ED" strokeWidth="0.8" opacity={0.8} />
        <Path d="M121 44 L67 86" stroke="#FFF7ED" strokeWidth="0.8" opacity={0.8} />
      </G>
    </G>
  </Svg>
);

/** Ornate Islamic Arabesque Card Back Pattern */
export const CardBackPattern: React.FC<{ width: number; height: number; theme?: 'red' | 'green' }> = ({
  width,
  height,
  theme = 'red',
}) => {
  const isRed = theme === 'red';
  const bgGradStart = isRed ? '#7F1D1D' : '#0B3820';
  const bgGradEnd = isRed ? '#450A0A' : '#062013';

  return (
    <Svg width={width} height={height} viewBox="0 0 100 140">
      <Defs>
        <LinearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgGradStart} />
          <Stop offset="100%" stopColor={bgGradEnd} />
        </LinearGradient>
      </Defs>

      {/* Card Border frame */}
      <Rect x="3" y="3" width="94" height="134" rx="7" fill="url(#backGrad)" stroke="#E5B842" strokeWidth="2.5" />
      <Rect x="7" y="7" width="86" height="126" rx="5" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3,2" />

      {/* Center Arabesque Medallion */}
      <Circle cx="50" cy="70" r="28" fill="none" stroke="#FDE68A" strokeWidth="1.5" />
      <Circle cx="50" cy="70" r="24" fill={isRed ? '#991B1B' : '#0E4829'} stroke="#E5B842" strokeWidth="1" />

      {/* Star of David / 8-point Octagram */}
      <Polygon points="50,48 56,64 72,58 63,70 72,82 56,76 50,92 44,76 28,82 37,70 28,58 44,64" fill="#F59E0B" opacity={0.85} />
      <Circle cx="50" cy="70" r="8" fill="#FDE68A" />
      <Circle cx="50" cy="70" r="4" fill={isRed ? '#7F1D1D' : '#062013'} />

      {/* Corner Filigree Knots */}
      <Circle cx="15" cy="15" r="5" fill="none" stroke="#E5B842" strokeWidth="1.2" />
      <Circle cx="85" cy="15" r="5" fill="none" stroke="#E5B842" strokeWidth="1.2" />
      <Circle cx="15" cy="125" r="5" fill="none" stroke="#E5B842" strokeWidth="1.2" />
      <Circle cx="85" cy="125" r="5" fill="none" stroke="#E5B842" strokeWidth="1.2" />
    </Svg>
  );
};

export const RenderSuitIcon: React.FC<{ suit: SuitType; size?: number }> = ({ suit, size = 20 }) => {
  switch (suit) {
    case 'spades':
      return <SpadesIcon size={size} color="#1C1917" />;
    case 'hearts':
      return <HeartsIcon size={size} color="#C5221F" />;
    case 'diamonds':
      return <DiamondsIcon size={size} color="#C5221F" />;
    case 'clubs':
      return <ClubsIcon size={size} color="#1C1917" />;
    case 'dineri':
      return <DineriIcon size={size} />;
    case 'coupe':
      return <CoupeIcon size={size} />;
    case 'bastoni':
      return <BastoniIcon size={size} />;
    case 'spade':
      return <TunisianSpadeIcon size={size} />;
    default:
      return null;
  }
};
