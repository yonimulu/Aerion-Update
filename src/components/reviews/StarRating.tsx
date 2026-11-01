import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5 (can be fractional like 4.7)
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const starSize = sizeClasses[size];
  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <div className="flex items-center space-x-0.5" role={interactive ? 'radiogroup' : undefined}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = activeRating >= starNumber;
          const isHalf = !isFilled && activeRating >= starNumber - 0.5 && hoverRating === null;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starNumber)}
              onMouseEnter={() => interactive && setHoverRating(starNumber)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive 
                  ? 'cursor-pointer hover:scale-120 focus:outline-hidden text-amber-500' 
                  : 'cursor-default pointer-events-none'
              }`}
              title={interactive ? `Rate ${starNumber} star${starNumber > 1 ? 's' : ''}` : undefined}
            >
              {isHalf ? (
                <div className={`relative ${starSize}`}>
                  <Star className={`${starSize} text-zinc-300 dark:text-zinc-700 fill-zinc-300 dark:fill-zinc-700`} />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className={`${starSize} text-amber-400 fill-amber-400`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${starSize} transition-colors ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 dark:text-amber-400 dark:fill-amber-400'
                      : 'text-zinc-300 dark:text-zinc-700 fill-zinc-200 dark:fill-zinc-800'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 ml-1.5">
          {rating > 0 ? rating.toFixed(1) : 'No reviews'}
        </span>
      )}
    </div>
  );
};
