import React from 'react';
import type { Tool } from '../types';
import { ChevronDoubleLeftIcon } from './icons/ChevronDoubleLeftIcon';

interface SidebarProps {
  tools: Tool[];
  onToolSelect: (tool: Tool) => void;
  activeTool: Tool | null;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tools, onToolSelect, activeTool, isMobileOpen, setMobileOpen, isCollapsed, setCollapsed }) => {
  const handleSelect = (tool: Tool) => {
    onToolSelect(tool);
    setMobileOpen(false); // Close mobile sidebar on selection
  }

  return (
    <>
      <aside 
        className={`fixed top-0 left-0 z-20 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className={`flex-grow p-4 overflow-y-auto ${isCollapsed ? 'pt-4' : 'pt-20 md:pt-4'}`}>
           <h2 className={`text-2xl font-bold text-black dark:text-white tracking-tighter mb-8 ${isCollapsed ? 'hidden' : 'block'}`}>
            Tools
          </h2>
          <nav className="space-y-2">
            {tools.map((tool) => {
              const isActive = activeTool?.id === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelect(tool)}
                  className={`w-full flex items-center p-2 rounded-md text-left text-sm font-medium transition-colors group ${isCollapsed ? 'justify-center' : ''} ${
                    isActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={isCollapsed ? tool.name : ''}
                >
                  <div className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-white dark:bg-black' : 'bg-black dark:bg-gray-800 group-hover:bg-gray-700 dark:group-hover:bg-gray-600'
                  }`}>
                    <tool.icon className={`w-5 h-5 ${isActive ? 'text-black dark:text-white' : 'text-white dark:text-gray-200'}`} />
                  </div>
                  <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{tool.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 hidden md:block ${isCollapsed ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => setCollapsed(!isCollapsed)}
              className="w-full flex items-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white group"
            >
              <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Collapse</span>
            </button>
        </div>
      </aside>
      {isMobileOpen && <div className="fixed inset-0 bg-black/60 z-10 md:hidden" onClick={() => setMobileOpen(false)}></div>}
    </>
  );
};