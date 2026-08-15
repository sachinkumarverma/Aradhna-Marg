import React from 'react';

export const FormLoader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm h-full w-full min-h-[400px]">
      <div className="relative">
        <div className="absolute inset-0 border-4 border-[#ff3b00] rounded-full animate-ping opacity-20"></div>
        <div
          className="w-20 h-20 rounded-full overflow-hidden border border-[#ff3b00]/30 shadow-lg animate-spin bg-white flex items-center justify-center p-2 relative z-10"
          style={{ animationDuration: '3s' }}
        >
          <img src="/logo.png" alt="Loading..." className="w-full h-full object-contain rounded-full" />
        </div>
      </div>
      <h3 className="mt-8 text-lg font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
        Loading Details...
      </h3>
      <p className="text-sm text-slate-500 mt-1">Please wait a moment while we fetch the data.</p>
    </div>
  );
};
