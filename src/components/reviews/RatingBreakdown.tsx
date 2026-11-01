import React from 'react';
import { Star } from 'lucide-react';
import { RatingSummary } from '../../types/review';
import { StarRating } from './StarRating';

interface RatingBreakdownProps {
  summary: RatingSummary;
  selectedStarFilter?: number;
  onSelectStarFilter?: (star?: number) => void;
  onWriteReviewClick?: () => void;
  hasUserReviewed?: boolean;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  summary,
  selectedStarFilter,
  onSelectStarFilter,
  onWriteReviewClick,
  hasUserReviewed = false
}) => {
  const { averageRating, totalReviews, distribution } = summary;

  const starTiers = [5, 4, 3, 2, 1] as const;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Big Average Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800/80 text-center space-y-2 shadow-2xs">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-zinc-950 dark:text-white">
            {totalReviews > 0 ? averageRating.toFixed(1) : '—'}
          </div>

          <StarRating rating={averageRating} size="md" />

          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-medium">
            {totalReviews === 0
              ? 'No evaluations recorded'
              : `Based on ${totalReviews} peer review${totalReviews === 1 ? '' : 's'}`}
          </p>

          {onWriteReviewClick && (
            <button
              onClick={onWriteReviewClick}
              className="mt-3 w-full py-2 px-4 rounded-lg bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{hasUserReviewed ? 'Edit Your Review' : 'Write a Review'}</span>
            </button>
          )}
        </div>

        {/* Right Column: 1-5 Star Distribution Progress Bars */}
        <div className="md:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Rating Distribution
            </span>
            {selectedStarFilter && (
              <button
                onClick={() => onSelectStarFilter && onSelectStarFilter(undefined)}
                className="text-xs font-semibold text-black dark:text-white underline hover:opacity-80 cursor-pointer"
              >
                Clear filter ({selectedStarFilter}★)
              </button>
            )}
          </div>

          {starTiers.map((star) => {
            const count = distribution[star] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isSelected = selectedStarFilter === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => {
                  if (onSelectStarFilter) {
                    onSelectStarFilter(isSelected ? undefined : star);
                  }
                }}
                className={`w-full group flex items-center space-x-3 text-left py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-200 dark:bg-zinc-800 ring-1 ring-black dark:ring-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
                title={`Filter by ${star} star reviews (${count})`}
              >
                <div className="w-12 flex items-center space-x-1 shrink-0 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isSelected
                        ? 'bg-amber-400'
                        : 'bg-zinc-900 dark:bg-zinc-100 group-hover:bg-amber-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count and Percentage */}
                <div className="w-16 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{count}</span>
                  <span className="text-[10px] ml-1 text-zinc-400 dark:text-zinc-500">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
