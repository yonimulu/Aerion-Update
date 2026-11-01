import React, { useMemo } from 'react';
import { Layers, Flame, Box, Cpu, Compass, Zap, Shield, Anchor, ArrowRight } from 'lucide-react';
import { CATEGORIES_INFO, getCategoriesWithDetails } from '../data/initialRocketComponents';
import { RocketCategory, RocketComponent } from '../types/rocket';

interface CategoriesPageProps {
  components: RocketComponent[];
  categories?: string[];
  onSelectCategory: (category: RocketCategory) => void;
  onSelectComponent: (id: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  components,
  categories,
  onSelectCategory,
  onSelectComponent
}) => {
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

  // Strictly derive categories that exist on components in the database
  const activeCategories = useMemo(() => {
    const catSet = new Set<string>();

    components.forEach((c) => {
      const trimmed = c.category?.trim();
      if (trimmed) catSet.add(trimmed);
    });

    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        const trimmed = c?.trim();
        if (trimmed && components.some((comp) => (comp.category || '').trim().toLowerCase() === trimmed.toLowerCase())) {
          catSet.add(trimmed);
        }
      });
    }

    if (catSet.size === 0) {
      return [];
    }

    const details = getCategoriesWithDetails(Array.from(catSet), components);
    return details.filter((cat) => {
      return components.some((comp) => (comp.category || '').trim().toLowerCase() === cat.id.trim().toLowerCase());
    });
  }, [categories, components]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 bg-transparent transition-colors duration-200">
      {/* Page Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest font-semibold">
          <Layers className="w-4 h-4 text-black dark:text-white" />
          <span>Launch Vehicle Architecture</span>
        </div>
        <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">
          Rocket Subsystems & Categories
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl leading-relaxed">
          Modern launch vehicles integrate specialized engineering domains. Explore how each subsystem functions, its primary flight role, and the hardware components engineered to survive extreme space environments.
        </p>
      </div>

      {/* Subsystem Cards Detailed List */}
      <div className="space-y-8">
        {activeCategories.length === 0 ? (
          <div className="text-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-8 space-y-3">
            <Layers className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600" />
            <div className="text-base font-bold text-black dark:text-white">No categories found in the database</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Categories will automatically appear here once entries are catalogued in the database.
            </p>
          </div>
        ) : (
          activeCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.iconName);
          const catComponents = components.filter((c) => c.category === cat.id);

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 hover:border-black dark:hover:border-zinc-600 transition-colors shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                        {catComponents.length} {catComponents.length === 1 ? 'component' : 'components'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                      {cat.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCategory(cat.id)}
                  className="px-4 py-2 rounded-lg bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-mono text-xs font-semibold flex items-center space-x-1.5 self-start transition-colors shadow-xs"
                >
                  <span>Explore Category</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-4xl">
                {cat.description}
              </p>

              {/* Typical Common Hardware Tags */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-semibold">
                  Common Assemblies:
                </span>
                <div className="flex flex-wrap gap-2">
                  {cat.commonComponents.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Catalogued components preview in this category */}
              {catComponents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-semibold">
                    Components:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catComponents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectComponent(item.id)}
                        className="text-left p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-600 transition-colors flex items-center justify-between group"
                      >
                        <div className="space-y-0.5 truncate max-w-[80%]">
                          <div className="text-xs font-bold text-black dark:text-white group-hover:underline truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                            {item.designation || item.stageLocation || 'Details'}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
