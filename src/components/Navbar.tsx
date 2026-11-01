import React, { useState } from 'react';
import { Rocket, Search, Menu, X, Layers, Settings, Compass, Info, Monitor, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string, componentId?: string) => void;
  onSearchSubmit?: (query: string) => void;
  onOpenDesktopInstall?: () => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onNavigate, 
  onSearchSubmit,
  onOpenDesktopInstall,
  isNightMode = false,
  onToggleNightMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim() && onSearchSubmit) {
      onSearchSubmit(navSearch.trim());
      setNavSearch('');
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'explore', label: 'Explore', icon: Rocket },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-black border border-zinc-300 dark:border-zinc-800 overflow-hidden flex items-center justify-center shadow-xs group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-all duration-200 shrink-0">
              <img 
                src="/assets/aistudio/Gemini_Generated_Image_bjq68cbjq68cbjq6_1f096957.jfif" 
                alt="Aerion Aerospace Logo" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-wider text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-zinc-200 transition-colors uppercase font-mono leading-tight">
                Aerion
              </h1>
              <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">
                Aerospace Catalog
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hardware..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white font-mono transition-colors"
              />
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-xs uppercase tracking-wider font-semibold font-mono flex items-center space-x-1.5 transition-all ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Desktop Install / Add to Desktop Button */}
            {onOpenDesktopInstall && (
              <button
                type="button"
                onClick={onOpenDesktopInstall}
                className="ml-2 px-3 py-1.5 rounded-md text-xs font-mono font-semibold text-black dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center space-x-1.5 transition-colors shadow-xs"
                title="Add project to Windows Desktop or launch standalone app"
              >
                <Monitor className="w-3.5 h-3.5 text-black dark:text-zinc-200" />
                <span className="hidden xl:inline">Add to Desktop</span>
                <span className="xl:hidden">Desktop</span>
              </button>
            )}

            {/* Classic Night Mode Toggle */}
            {onToggleNightMode && (
              <button
                type="button"
                onClick={onToggleNightMode}
                className="ml-2 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
                title={isNightMode ? 'Switch to Day Mode' : 'Switch to Classic Night Mode'}
                aria-label={isNightMode ? 'Switch to Day Mode' : 'Switch to Classic Night Mode'}
              >
                {isNightMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-zinc-200" />
                    <span className="hidden xl:inline">Day</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-zinc-800" />
                    <span className="hidden xl:inline">Night</span>
                  </>
                )}
              </button>
            )}
          </nav>

          {/* Mobile menu and tools */}
          <div className="flex lg:hidden items-center space-x-2">
            {onToggleNightMode && (
              <button
                type="button"
                onClick={onToggleNightMode}
                className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 transition-colors"
                title={isNightMode ? 'Switch to Day Mode' : 'Switch to Classic Night Mode'}
              >
                {isNightMode ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-800" />}
              </button>
            )}
            {onOpenDesktopInstall && (
              <button
                type="button"
                onClick={onOpenDesktopInstall}
                className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                title="Add to Desktop"
              >
                <Monitor className="w-4 h-4 text-black dark:text-zinc-200" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search components..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white"
            />
          </form>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-semibold font-mono flex items-center space-x-2 text-left ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Night mode toggle inside mobile menu */}
            {onToggleNightMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleNightMode();
                }}
                className="w-full px-3 py-2.5 rounded-md text-sm font-semibold font-mono flex items-center justify-between text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-2"
              >
                <div className="flex items-center space-x-2">
                  {isNightMode ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-800" />}
                  <span>{isNightMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}</span>
                </div>
                <span className="text-xs uppercase font-mono text-zinc-500 dark:text-zinc-400">
                  {isNightMode ? 'Active' : 'Off'}
                </span>
              </button>
            )}

            {onOpenDesktopInstall && (
              <button
                type="button"
                onClick={() => {
                  onOpenDesktopInstall();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-md text-sm font-semibold font-mono flex items-center space-x-2 text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-2"
              >
                <Monitor className="w-4 h-4 text-black dark:text-zinc-200" />
                <span>Add to Desktop / Install App</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
