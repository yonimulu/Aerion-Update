import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rocket, Search, ArrowRight, Layers, Flame, Cpu, Shield, Compass, Zap, Anchor, Box, ChevronRight, Sparkles, X, CornerDownLeft, History } from 'lucide-react';
import { RocketComponent, RocketCategory } from '../types/rocket';
import { CATEGORIES_INFO, getCategoriesWithDetails } from '../data/initialRocketComponents';
import { ComponentCard } from '../components/ComponentCard';
import { StorageService } from '../services/storageService';
import { RecentSearchService } from '../services/recentSearchService';

interface HomePageProps {
  components: RocketComponent[];
  categories?: string[];
  onSelectComponent: (id: string) => void;
  onNavigate: (tab: string, categoryFilter?: string) => void;
  onSearch: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  components,
  categories,
  onSelectComponent,
  onNavigate,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [featuredCategoryFilter, setFeaturedCategoryFilter] = useState('All');
  
  // Recently searched queries persisted in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => RecentSearchService.getRecentSearches());

  useEffect(() => {
    setRecentSearches(RecentSearchService.getRecentSearches());
  }, []);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time live search matches (published components only)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return components
      .filter((c) => (c.status || 'published') === 'published')
      .filter((c) => {
        const name = (c.component_name || c.name || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const desc = (c.definition_description || c.shortDescription || c.overview || '').toLowerCase();
        const loc = (c.location_installation_context || c.stageLocation || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || desc.includes(q) || loc.includes(q);
      });
  }, [components, searchQuery]);

  const displayedResults = useMemo(() => searchResults.slice(0, 6), [searchResults]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (selectedIndex >= 0 && displayedResults[selectedIndex]) {
      const selectedItem = displayedResults[selectedIndex];
      const itemName = selectedItem.component_name || selectedItem.name;
      const updated = RecentSearchService.addRecentSearch(itemName);
      setRecentSearches(updated);
      onSelectComponent(selectedItem.id);
      return;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      const updated = RecentSearchService.addRecentSearch(term);
      setRecentSearches(updated);
      onSearch(term);
    } else {
      onNavigate('explore');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || displayedResults.length === 0) {
      if (e.key === 'ArrowDown' && searchQuery.trim()) {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedResults.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && displayedResults[selectedIndex]) {
        e.preventDefault();
        setIsDropdownOpen(false);
        const selectedItem = displayedResults[selectedIndex];
        const itemName = selectedItem.component_name || selectedItem.name;
        const updated = RecentSearchService.addRecentSearch(itemName);
        setRecentSearches(updated);
        onSelectComponent(selectedItem.id);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectItem = (id: string) => {
    setIsDropdownOpen(false);
    const item = components.find((c) => c.id === id);
    if (item) {
      const itemName = item.component_name || item.name;
      const updated = RecentSearchService.addRecentSearch(itemName);
      setRecentSearches(updated);
    }
    onSelectComponent(id);
  };

  const publishedComponents = useMemo(() => components.filter((c) => (c.status || 'published') === 'published'), [components]);
  const featuredComponents = publishedComponents.filter((c) => c.featured);
  const baseFeatured = featuredComponents.length > 0 ? featuredComponents : publishedComponents.slice(0, 4);
  const featuredCategories = ['All', ...Array.from(new Set(baseFeatured.map((c) => c.category)))];
  const displayedFeatured = featuredCategoryFilter === 'All'
    ? baseFeatured
    : baseFeatured.filter((c) => c.category === featuredCategoryFilter);

  const getCategoryCount = (catId: RocketCategory | string) => {
    return components.filter((c) => (c.category || '').trim().toLowerCase() === (catId || '').trim().toLowerCase()).length;
  };

  // Strictly derive categories that exist on components in the database
  const dynamicCategories = useMemo(() => {
    const categoriesInDb = new Set<string>();

    // 1. Gather all categories actually present on components in the database
    components.forEach((c) => {
      const cat = c.category?.trim();
      if (cat) {
        categoriesInDb.add(cat);
      }
    });

    // 2. If categories prop has values, only keep ones with items in the database
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        const trimmed = cat?.trim();
        if (trimmed && components.some((c) => (c.category || '').trim().toLowerCase() === trimmed.toLowerCase())) {
          categoriesInDb.add(trimmed);
        }
      });
    }

    if (categoriesInDb.size === 0) {
      return [];
    }

    // Convert to rich metadata cards
    const details = getCategoriesWithDetails(Array.from(categoriesInDb), components);

    // Filter strictly to categories that exist with at least 1 component in the database
    return details.filter((cat) => getCategoryCount(cat.id) > 0);
  }, [categories, components]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'Box': return Box;
      case 'Cpu': return Cpu;
      case 'Compass': return Compass;
      case 'Zap': return Zap;
      case 'Shield': return Shield;
      case 'Anchor': return Anchor;
      default: return Layers;
    }
  };

  return (
    <div className="space-y-16 pb-16 bg-transparent transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative z-30 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24 overflow-hidden">
        {/* Technical Aerospace Blueprint Background with rockets and flight schematics */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Direct reference to user uploaded blueprint asset */}
          <div 
            className="absolute inset-0 bg-no-repeat bg-cover transition-opacity duration-300 opacity-95 dark:opacity-45 dark:invert"
            style={{
              backgroundImage: `url('/assets/aistudio/Gemini_Generated_Image_4i7c3d4i7c3d4i7c__3__9dd02a1f.jfif')`,
              backgroundPosition: 'center 42%',
              backgroundSize: 'cover',
            }}
          />

          {/* Soft radial overlay keeping live search and typography crystal clear */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_68%_at_50%_48%,rgba(248,249,250,0.82)_0%,rgba(248,249,250,0.35)_55%,transparent_100%)] dark:bg-[radial-gradient(ellipse_75%_68%_at_50%_48%,rgba(9,9,11,0.85)_0%,rgba(9,9,11,0.4)_55%,transparent_100%)]" />

          {/* Technical blueprint grid overlay for crisp aerospace aesthetic */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Title */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xs text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-xs">
              <img 
                src="/assets/aistudio/Gemini_Generated_Image_bjq68cbjq68cbjq6_1f096957.jfif" 
                alt="Aerion Logo" 
                className="w-4 h-4 rounded-xs object-cover"
              />
              <span className="tracking-wide">Aerion Engineering Catalog</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-black dark:text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]">
              Explore the Engineering <br className="hidden sm:block" />
              Behind Rockets
            </h1>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
              A comprehensive technical catalog for students, systems engineers, and aerospace enthusiasts. Discover the operating physics, material science, and design principles powering modern orbital launch vehicles.
            </p>
          </div>

          {/* Search Bar with Real-Time Dropdown */}
          <div ref={searchContainerRef} className="max-w-2xl mx-auto relative z-40">
            <form onSubmit={handleHeroSearch} className="relative flex items-center shadow-sm">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setIsDropdownOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search rocket components..."
                className="w-full pl-12 pr-36 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all font-mono"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 rounded-lg bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-mono font-semibold text-xs sm:text-sm transition-all flex items-center space-x-1"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Real-Time Search Results Dropdown */}
            {isDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-left divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in-50 duration-150">
                {/* Dropdown Header */}
                <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {searchResults.length} {searchResults.length === 1 ? 'component found' : 'components found'}
                  </span>
                  <span className="hidden sm:inline">Use ↑ ↓ to navigate • Enter to inspect</span>
                </div>

                {/* Matches List */}
                {displayedResults.length > 0 ? (
                  <>
                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {displayedResults.map((item, idx) => {
                        const itemImg = StorageService.resolveComponentImageUrl(item);
                        const isSelected = selectedIndex === idx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item.id)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                              isSelected ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0"
                                  onError={async (e) => {
                                    if (item.image_storage_path && !item.image_storage_path.startsWith('data:')) {
                                      const signed = await StorageService.getSignedUrl(item.image_storage_path);
                                      if (signed) {
                                        (e.currentTarget as HTMLImageElement).src = signed;
                                        return;
                                      }
                                    }
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                                  <Rocket className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                </div>
                              )}
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs sm:text-sm font-bold text-black dark:text-white truncate">
                                    {item.component_name || item.name}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                    {item.category}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {item.definition_description || item.shortDescription || item.overview}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Dropdown Footer Link to Full Catalog */}
                    <div
                      onClick={() => {
                        setIsDropdownOpen(false);
                        const term = searchQuery.trim();
                        if (term) {
                          const updated = RecentSearchService.addRecentSearch(term);
                          setRecentSearches(updated);
                          onSearch(term);
                        } else {
                          onNavigate('explore');
                        }
                      }}
                      className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800 cursor-pointer flex items-center justify-between text-xs font-mono font-semibold text-black dark:text-white transition-colors"
                    >
                      <span>View all {searchResults.length} results in Catalog</span>
                      <div className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        <span>Search Catalog</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500">
                      <Search className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      No components found matching &quot;<span className="text-black dark:text-white font-semibold">{searchQuery}</span>&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        const term = searchQuery.trim();
                        if (term) {
                          const updated = RecentSearchService.addRecentSearch(term);
                          setRecentSearches(updated);
                          onSearch(term);
                        } else {
                          onNavigate('explore');
                        }
                      }}
                      className="text-xs font-mono font-semibold text-black dark:text-white hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Search catalog anyway</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recently Searched Quick-Access */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] font-mono">
              <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 mr-1 select-none">
                <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="uppercase tracking-wider font-semibold text-[10px]">Recently Searched:</span>
              </div>
              {recentSearches.length > 0 ? (
                <>
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="group inline-flex items-center rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = RecentSearchService.addRecentSearch(term);
                          setRecentSearches(updated);
                          onSearch(term);
                        }}
                        title={`Search for "${term}"`}
                        className="px-2.5 py-1 text-left flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-black dark:group-hover:bg-white transition-colors" />
                        <span className="font-medium truncate max-w-[150px] sm:max-w-none">{term}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = RecentSearchService.removeRecentSearch(term);
                          setRecentSearches(updated);
                        }}
                        title={`Remove "${term}" from history`}
                        aria-label={`Remove ${term}`}
                        className="pr-1.5 pl-0.5 py-1 text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = RecentSearchService.clearRecentSearches();
                      setRecentSearches(updated);
                    }}
                    title="Clear recent searches"
                    className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:underline px-1.5 py-1 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] italic">No recent searches</span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shadow-sm"
            >
              <Rocket className="w-4 h-4" />
              <span>Explore Components</span>
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className="px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono font-semibold text-xs uppercase tracking-wider transition-all flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-black dark:text-white" />
              <span>Browse Subsystems</span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Section - only displayed if categories exist in the database */}
      {dynamicCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <div className="text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider font-semibold">Subsystem Breakdown</div>
              <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">Core Aerospace Categories</h2>
            </div>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center space-x-1"
            >
              <span>View Subsystem Guides</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconName);
              const count = getCategoryCount(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('explore', cat.id)}
                  className="group p-5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                      {count} {count === 1 ? 'part' : 'parts'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-zinc-200 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {cat.shortDescription}
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] font-mono text-black dark:text-zinc-200 font-semibold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                    <span>Explore items</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Hardware Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Highlights</span>
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">Featured Components</h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('admin')}
              className="text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hidden sm:flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 rounded-lg px-2.5 py-1 transition-colors"
            >
              <span>Manage Highlights</span>
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs font-mono font-semibold text-black dark:text-white hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center space-x-1"
            >
              <span>View Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subsystem Filter Pills for Featured Hardware */}
        {featuredCategories.length > 2 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 mr-1 text-[11px]">Subsystem:</span>
            {featuredCategories.map((cat) => {
              const isActive = featuredCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFeaturedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-semibold'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}

        {displayedFeatured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedFeatured.map((comp) => (
              <ComponentCard
                key={comp.id}
                component={comp}
                onSelect={onSelectComponent}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
              <Sparkles className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h3 className="text-sm font-bold text-black dark:text-white font-mono">No Featured Hardware In This Category</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              No components in &quot;{featuredCategoryFilter}&quot; are currently flagged as featured highlights.
            </p>
            <button
              onClick={() => setFeaturedCategoryFilter('All')}
              className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-mono font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Reset to All Featured
            </button>
          </div>
        )}
      </section>

      {/* Rocket Anatomy Educational Blueprint Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest font-semibold">
              Aerospace Systems Integration
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white">
              How Launch Vehicle Subsystems Work Together
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              A multi-stage orbital rocket is not a single engine, but a tightly coupled integration of fluid dynamics, hypersonic aerothermodynamics, fault-tolerant electronics, and structural mechanics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs font-bold">
                <Box className="w-4 h-4" />
                <span>Atmospheric Ascent & Staging</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Booster engines fire at sea-level pressure. High-frequency guidance computers steer the gimbal actuators through Max-Q until fuel exhaustion, upon which pneumatic pushers separate the spent stage.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs font-bold">
                <Compass className="w-4 h-4" />
                <span>Vacuum Trajectory & GNC</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Above the atmosphere, composite fairings jettison to drop dead weight. Upper stage engines ignite while ring laser gyroscopes and cold gas RCS thrusters point precisely toward orbital insertion.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center space-x-2 text-black dark:text-white font-mono text-xs font-bold">
                <Shield className="w-4 h-4" />
                <span>Reentry & Controlled Recovery</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Reusable boosters deploy titanium grid fins to steer through hypersonic plasma friction. PICA-X heat shields absorb thermal flux before supersonic drogues or landing burn thrusters touch down.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
