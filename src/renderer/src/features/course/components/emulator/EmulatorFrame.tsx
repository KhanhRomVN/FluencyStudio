import React, { ReactNode } from 'react';

interface EmulatorFrameProps {
  children: ReactNode;
}

export const EmulatorFrame: React.FC<EmulatorFrameProps> = ({ children }) => {
  return (
    <div className="flex justify-center h-full overflow-hidden bg-gray-100 p-4">
      <div className="relative w-[375px] h-full max-h-[812px] bg-white border-4 border-gray-800 rounded-[3rem] shadow-xl overflow-hidden flex flex-col">
        {/* Notch/Status Bar Area */}
        <div className="h-8 bg-gray-800 w-full absolute top-0 z-10 flex justify-center">
          <div className="w-1/3 h-full bg-black rounded-b-xl"></div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto mt-8 pt-2 scrollbar-hide">{children}</div>

        {/* Home Indicator */}
        <div className="h-6 bg-white w-full flex justify-center items-center pb-2">
          <div className="w-1/3 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
