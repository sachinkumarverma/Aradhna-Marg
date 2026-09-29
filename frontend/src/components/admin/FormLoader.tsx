import React from 'react';
import { CustomLoader } from '@components/common/CustomLoader';

export const FormLoader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm h-full w-full min-h-[400px]">
      <CustomLoader size="xl" text="Loading Details..." />
      <p className="text-sm text-slate-500 mt-1">Please wait a moment while we fetch the data.</p>
    </div>
  );
};
