import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface NoiceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const NoiceButton: React.FC<NoiceButtonProps> = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full relative group h-12 px-8 flex items-center justify-center gap-2 
      font-medium bg-primary/10 hover:bg-primary/20 
      text-primary hover:text-primary 
      rounded-lg transition-all duration-300 overflow-hidden
      border border-primary/20 hover:border-primary/30"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
    </div>
    <div className="relative flex items-center justify-center gap-2 text-lg">
      {children}
    </div>
  </button>
);

export default NoiceButton;