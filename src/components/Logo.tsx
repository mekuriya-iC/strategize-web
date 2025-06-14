import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({
  width = 160,
  height = 40,
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="Strategize Logo"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
