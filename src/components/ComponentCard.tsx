import React, { useState, useEffect } from 'react';
import { RocketComponent } from '../types/rocket';
import { ArrowUpRight, Cpu, Flame, Box, Compass, Zap, Shield, Anchor, Layers, Star } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { ReviewService } from '../services/reviewService';
import { RatingSummary } from '../types/review';

interface ComponentCardProps {
  component: RocketComponent;
  onSelect: (id: string) => void;
}

export const getCategoryBadgeStyle = (category: string = '') => {
  const lower = (category || '').toLowerCase();
  let Icon = Layers;

  if (lower.includes('propul') || lower.includes('engine') || lower.includes('thrust') || lower.includes('flame')) {
    Icon = Flame;
  } else if (lower.includes('avion') || lower.includes('comput') || lower.includes('cpu') || lower.includes('soft') || lower.includes('sensor')) {
    Icon = Cpu;
  } else if (lower.includes('guid') || lower.includes('nav') || lower.includes('compass') || lower.includes('control') || lower.includes('steer')) {
    Icon = Compass;
  } else if (lower.includes('elect') || lower.includes('power') || lower.includes('battery') || lower.includes('zap') || lower.includes('solar')) {
    Icon = Zap;
  } else if (lower.includes('therm') || lower.includes('shield') || lower.includes('heat') || lower.includes('protect')) {
    Icon = Shield;
  } else if (lower.includes('recov') || lower.includes('anchor') || lower.includes('chute') || lower.includes('land') || lower.includes('drop')) {
    Icon = Anchor;
  } else if (lower.includes('struct') || lower.includes('airframe') || lower.includes('box') || lower.includes('fairing') || lower.includes('shell') || lower.includes('body')) {
    Icon = Box;
  } else {
    Icon = Layers;
  }

  return {
    bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
    dot: 'bg-zinc-900 dark:bg-zinc-200',
    icon: Icon
  };
};

import { ComponentService } from '../services/componentService';

export const ComponentCard: React.FC<ComponentCardProps> = ({ component, onSelect }) => {
  const badge = getCategoryBadgeStyle(component.category);
  const CategoryIcon = badge.icon;

  const [currentImg, setCurrentImg] = useState<string>(() => StorageService.resolveComponentImageUrl(component));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [triedAutoRepair, setTriedAutoRepair] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; totalReviews: number } | null>(null);

  useEffect(() => {
    ReviewService.getItemRatingSummary(component.id).then((summary) => {
      setRatingSummary({
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews
      });
    }).catch(() => {});
  }, [component.id]);

  useEffect(() => {
    const resolved = StorageService.resolveComponentImageUrl(component);
    setCurrentImg(resolved);
    setImageLoaded(false);
    setImageError(!resolved);
    setTriedAutoRepair(false);

    // If image is missing or a broken search URL, trigger automatic retrieval in background
    if (!resolved && !triedAutoRepair) {
      setTriedAutoRepair(true);
      ComponentService.autoRetrieveAndSaveImage(component.id).then((res) => {
        if (res.success && res.component?.image_url) {
          setCurrentImg(res.component.image_url);
          setImageError(false);
        }
      }).catch(() => {});
    }
  }, [component.id, component.image_url, component.image_storage_path, component.imageUrl]);

  const handleImageError = async () => {
    if (!triedAutoRepair) {
      setTriedAutoRepair(true);
      try {
        const res = await ComponentService.autoRetrieveAndSaveImage(component.id);
        if (res.success && res.component?.image_url) {
          setCurrentImg(res.component.image_url);
          setImageError(false);
          return;
        }
      } catch {
        // Fall back to professional placeholder
      }
    }
    setImageError(true);
  };

  const placeholderSvg = StorageService.getComponentPlaceholder(component);

  return (
    <div
      onClick={() => onSelect(component.id)}
      className="group bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-600 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative w-full h-48 bg-zinc-950 overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        {/* Loading shimmer indicator */}
        {!imageLoaded && !imageError && currentImg && (
          <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        )}

        {!imageError && currentImg ? (
            <img
              src={currentImg}
              alt={component.component_name || component.name}
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={handleImageError}
              className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
            />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={placeholderSvg}
              alt={`${component.component_name || component.name} technical placeholder`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {component.featured && (
          <div className="absolute top-2 right-2 pointer-events-none z-10">
            <span className="font-mono text-[10px] font-semibold text-white dark:text-black bg-black dark:bg-white px-2 py-0.5 rounded-full shadow-xs">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Subsystem Category Tag & Rating Badge */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium border ${badge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              <CategoryIcon className="w-3 h-3" />
              <span>{component.category}</span>
            </span>

            {ratingSummary && ratingSummary.totalReviews > 0 && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 shrink-0">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{ratingSummary.averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">({ratingSummary.totalReviews})</span>
              </span>
            )}
          </div>

          {/* Component Name */}
          <h3 className="text-base font-bold text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-zinc-200 transition-colors line-clamp-2">
            {component.component_name || component.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
            {component.definition_description || component.shortDescription || component.overview}
          </p>
        </div>

        {/* Footer CTA */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            {component.location_installation_context || component.stageLocation || 'Spaceflight hardware'}
          </span>
          <span className="text-black dark:text-white font-semibold group-hover:translate-x-0.5 flex items-center space-x-1 transition-transform">
            <span>Inspect</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
