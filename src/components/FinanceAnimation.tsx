import React from 'react';
import { motion } from 'framer-motion';

export const FinanceAnimation: React.FC = () => {
  const bars = [
    { height: 60, delay: 0, color: 'from-purple-600 to-purple-500' },
    { height: 80, delay: 0.1, color: 'from-purple-500 to-blue-500' },
    { height: 50, delay: 0.2, color: 'from-blue-500 to-blue-600' },
    { height: 90, delay: 0.3, color: 'from-blue-600 to-indigo-600' },
    { height: 70, delay: 0.4, color: 'from-indigo-600 to-purple-600' },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-end justify-center gap-3 h-48">
            {bars.map((bar, index) => (
              <motion.div
                key={index}
                className={`w-12 bg-gradient-to-t ${bar.color} rounded-t-lg shadow-md`}
                initial={{ height: 0 }}
                animate={{ height: `${bar.height}%` }}
                transition={{
                  duration: 0.8,
                  delay: bar.delay,
                  ease: 'easeOut',
                  repeat: Infinity,
                  repeatType: 'reverse',
                  repeatDelay: 1,
                }}
              />
            ))}
          </div>
          
          <div className="mt-6 relative h-1">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

