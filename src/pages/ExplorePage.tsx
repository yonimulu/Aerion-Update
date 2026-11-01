import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, X, Rocket, AlertCircle, RefreshCw } from 'lucide-react';
import { RocketComponent, RocketCategory } from '../types/rocket';
import { ComponentCard } from '../components/ComponentCard';
import { RecentSearchService } from '../services/recentSearchService';

interface ExplorePageProps {
  components: RocketComponent[];
  categories?: string[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectComponent: (id: string) => void;
  onNavigateHome: () => void;
}

type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-newest' | 'category';

export const ExplorePage: React.FC<ExplorePageProps> = ({
  components,
  categories,
  initialCategory = 'All',
  initialSearch = '',
  onSelectComponent,
  onNavigateHome
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc');

  // Dynamic categories list strictly aligned with database records
  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');

    // Only include categories that actually exist on components in the database
    components.forEach((c) => {
      const cat = c.category?.trim();
      if (cat) list.add(cat);
    });

    return Array.from(list);
  }, [components]);

  // Filter and sort logic
  const filteredAndSortedComponents = useMemo(() => {
    // Only published components appear in the public catalog
    let result = components.filter((c) => (c.status || 'published') === 'published');

    // Filter by Category
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          (c.designation && c.designation.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q) ||
          (c.stageLocation && c.stageLocation.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'alpha-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'alpha-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'date-newest') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [components, selectedCategory, search, sortBy]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSortBy('alpha-asc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-transparent min-h-[80vh] transition-colors duration-200">
      {/* Page Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest font-semibold">
          <Rocket className="w-4 h-4 text-black dark:text-white" />
          <span>Catalog</span>
        </div>
        <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
          Explore Rocket Components
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl leading-relaxed">
          Filter through aerospace subsystems, propulsion machinery, structural airframes, and flight computers. Select any component to inspect its operating physics, schematics, and engineering specifications.
        </p>
      </div>

      {/* Control Bar: Search & Sort */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  RecentSearchService.addRecentSearch(search.trim());
                }
              }}
              placeholder="Search components..."
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline flex items-center space-x-1 font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-200 text-xs font-mono focus:outline-none focus:border-black dark:focus:border-white"
            >
              <option value="alpha-asc">Alphabetical (A → Z)</option>
              <option value="alpha-desc">Alphabetical (Z → A)</option>
              <option value="date-newest">Recently Added / Updated</option>
              <option value="category">Group by Subsystem</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider shrink-0 mr-1 flex items-center space-x-1 font-semibold">
            <Filter className="w-3 h-3 text-black dark:text-white" />
            <span>Category:</span>
          </span>
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All' ? components.length : components.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-2">
        <div>
          Showing <span className="text-black dark:text-white font-bold">{filteredAndSortedComponents.length}</span> components
          {selectedCategory !== 'All' && (
            <span> in <span className="text-black dark:text-white font-semibold">{selectedCategory}</span></span>
          )}
          {search && (
            <span> matching <span className="text-black dark:text-white font-semibold">&quot;{search}&quot;</span></span>
          )}
        </div>

        {(search || selectedCategory !== 'All' || sortBy !== 'alpha-asc') && (
          <button
            onClick={handleClearFilters}
            className="text-black dark:text-white hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold flex items-center space-x-1 underline underline-offset-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Component Grid */}
      {filteredAndSortedComponents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedComponents.map((comp) => (
            <ComponentCard
              key={comp.id}
              component={comp}
              onSelect={onSelectComponent}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 mx-auto rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <AlertCircle className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black dark:text-white">No Matching Components Found</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
              No aerospace hardware matched the current query &quot;{search}&quot; or category &quot;{selectedCategory}&quot;.
            </p>
          </div>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-xs font-mono font-semibold transition-colors shadow-xs"
            >
              Clear All Filters
            </button>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
