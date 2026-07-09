import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ src, size = 48, className = '' }: AvatarProps) {
  const style = { width: `${size}px`, height: `${size}px` };
  
  if (src && src.trim().length > 0) {
    return (
      <img 
        src={src} 
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }} 
        className={`rounded-full bg-[#1c2026] border border-white/10 flex-shrink-0 ${className}`} 
      />
    );
  }

  return (
    <div style={style} className={`rounded-full bg-[#1c2026] border border-white/10 flex-shrink-0 flex items-center justify-center ${className}`}>
      <User size={Math.max(size * 0.35, 12)} className="text-gray-600" />
    </div>
  );
}
