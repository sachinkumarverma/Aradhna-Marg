import React from 'react';
import { CustomLoader } from '@components/common/CustomLoader';

export const FormLoader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm h-full w-full min-h-[360px] py-16">
      <CustomLoader
        fullScreen={false}
        size="xl"
        text="Loading Details..."
        subtext="Please wait a moment while we fetch the data."
      />
    </div>
  );
};
