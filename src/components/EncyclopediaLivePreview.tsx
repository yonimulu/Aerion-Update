import React from 'react';
import { RocketComponent } from '../types/rocket';
import { Calendar, Image as ImageIcon } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface EncyclopediaLivePreviewProps {
  data: Partial<RocketComponent>;
  activeImageSource?: string | null;
}

export const EncyclopediaLivePreview: React.FC<EncyclopediaLivePreviewProps> = ({
  data,
  activeImageSource
}) => {
  const componentName = data.component_name || data.name || 'Component Name';
  const category = data.category || 'Airframe, structures & flight controls';
  const status = data.status || 'draft';

  const previewImage = activeImageSource
    ? StorageService.resolveImageUrl(activeImageSource)
    : StorageService.resolveComponentImageUrl(data);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 text-zinc-950 dark:text-zinc-100 font-sans shadow-xs transition-colors">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-mono">
        <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
          <span>Component Preview</span>
        </span>
        <div className="flex items-center space-x-2">
          {data.featured && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black">
              FEATURED
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              status === 'published'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border border-zinc-300 dark:border-zinc-700'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {status.toUpperCase()}
          </span>
          {data.review_date && (
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Review: {data.review_date}</span>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tracking-tight">
          {componentName}
        </h1>

        <div className="text-xs sm:text-sm font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-wide border-b border-zinc-200 dark:border-zinc-800 pb-3">
          Category: <span className="font-semibold text-black dark:text-white">{category}</span>
        </div>
      </div>

      {/* Selected Image */}
      {previewImage ? (
        <div className="space-y-2">
          <div className="relative w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 max-h-80 flex items-center justify-center">
            <img
              src={previewImage}
              alt={data.image_alt_text || componentName}
              className="w-full h-full max-h-80 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          {(data.image_caption || data.image_title || data.image_source) && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-1 pt-1 font-mono">
              <span>{data.image_caption || data.image_title}</span>
              {data.image_source && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Source: {data.image_source}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-6 text-center text-xs text-zinc-400 font-mono flex flex-col items-center justify-center space-y-1 bg-zinc-50/50 dark:bg-zinc-950/50">
          <ImageIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          <span>[No image attached yet. Add via device upload or image URL.]</span>
        </div>
      )}

      {/* Section: Overview */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Overview
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.definition_description || data.overview || (
            <span className="text-zinc-400 italic">No definition entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Purpose */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Purpose & Role
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.purpose_engineering_value || data.purpose || (
            <span className="text-zinc-400 italic">No purpose entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Operating principle */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Operating Principle
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.operating_principle || data.operatingPrinciples || (
            <span className="text-zinc-400 italic">No operating principles entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Location */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Installation Context
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.location_installation_context || data.stageLocation || (
            <span className="text-zinc-400 italic">No installation location entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Applications */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Operational Applications
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.applications_operating_context || (
            <span className="text-zinc-400 italic">No application context entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Interfaces */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          System Interfaces
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.interfaces_system_connections || (
            <span className="text-zinc-400 italic">No interface connections entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Verification */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Verification Guidance
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.identification_verification_guidance || (
            <span className="text-zinc-400 italic">No verification guidance entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: Safety */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Safety & Limits
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.safety_limitations || (
            <span className="text-zinc-400 italic">No safety limitations entered yet.</span>
          )}
        </p>
      </div>

      {/* Section: References */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide font-mono">
          Technical References
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {data.technical_reference_guidance || (
            <span className="text-zinc-400 italic">No reference guidance entered yet.</span>
          )}
        </p>
      </div>
    </div>
  );
};
