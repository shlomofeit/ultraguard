interface LogoProps {
  size?: number;
}

const Logo = ({ size = 34 }: LogoProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <circle
        cx="17"
        cy="17"
        r="15.5"
        fill="none"
        stroke="#5fe3f0"
        strokeOpacity=".35"
      />
      <circle
        cx="17"
        cy="17"
        r="10"
        fill="none"
        stroke="#5fe3f0"
        strokeOpacity=".6"
      />
      <circle cx="17" cy="17" r="4.5" fill="#ffb84d" />
      <path
        d="M17 17 L30 9"
        stroke="#5fe3f0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
