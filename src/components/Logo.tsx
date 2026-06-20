

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export default function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-xs' },
    md: { icon: 36, text: 'text-base', sub: 'text-xs' },
    lg: { icon: 48, text: 'text-xl', sub: 'text-sm' },
  };
  const s = sizes[size];
  const textColor = variant === 'dark' ? 'text-gray-900' : 'text-white';
  const subColor = variant === 'dark' ? 'text-emerald-600' : 'text-emerald-300';

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon */}
      <div
        className="relative flex-shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={s.icon} height={s.icon}>
          {/* Outer circle */}
          <circle cx="24" cy="24" r="22" fill="#10B981" />
          {/* Recycling arrows */}
          <path d="M14 20 C14 14 20 10 24 10 C28 10 34 14 34 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M34 28 C34 34 28 38 24 38 C20 38 14 34 14 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Capsule */}
          <rect x="18" y="21" width="12" height="6" rx="3" fill="white" />
          <rect x="18" y="21" width="6" height="6" rx="0" fill="#2563EB" style={{ borderRadius: '3px 0 0 3px' }} />
          <rect x="18" y="21" width="6" height="6" fill="#2563EB" />
          {/* Cross symbol */}
          <path d="M24 16 L24 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 18 L26 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          {/* Arrow heads */}
          <path d="M32 18 L34 20 L36 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M16 30 L14 28 L12 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      {/* Text */}
      <div>
        <div className={`font-poppins font-bold ${s.text} ${textColor} leading-tight`}>
          MEDIALERT
        </div>
        <div className={`font-inter font-medium ${s.sub} ${subColor} leading-tight`}>
          Vizag
        </div>
      </div>
    </div>
  );
}
