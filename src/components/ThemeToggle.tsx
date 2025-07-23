import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={toggleDarkMode}
        className="group relative w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 overflow-hidden"
        aria-label="Toggle dark mode"
      >
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 dark:from-blue-400/20 dark:to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon container with smooth rotation */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <div className="relative w-4 h-4">
            {/* Sun icon */}
            <Sun 
              className={`absolute inset-0 w-4 h-4 text-amber-600 dark:text-amber-400 transition-all duration-500 ease-out ${
                isDarkMode 
                  ? 'opacity-0 rotate-90 scale-75' 
                  : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            
            {/* Moon icon */}
            <Moon 
              className={`absolute inset-0 w-4 h-4 text-slate-700 dark:text-blue-400 transition-all duration-500 ease-out ${
                isDarkMode 
                  ? 'opacity-100 rotate-0 scale-100' 
                  : 'opacity-0 -rotate-90 scale-75'
              }`}
            />
            
            {/* Monitor icon (system preference) */}
            <Monitor 
              className={`absolute inset-0 w-4 h-4 text-slate-500 transition-all duration-500 ease-out ${
                isDarkMode 
                  ? 'opacity-0 scale-75' 
                  : 'opacity-0 scale-75'
              }`}
            />
          </div>
        </div>

        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/10 to-yellow-500/10 dark:from-blue-400/10 dark:to-indigo-500/10 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/5 to-yellow-500/5 dark:from-blue-400/5 dark:to-indigo-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
      </div>
    </div>
  );
};

export default ThemeToggle; 