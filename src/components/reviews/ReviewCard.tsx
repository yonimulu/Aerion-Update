import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, Pencil, Trash2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Review, VoteType } from '../../types/review';
import { StarRating } from './StarRating';
import { AppUser } from '../../services/authService';

interface ReviewCardProps {
  review: Review;
  currentUser: AppUser | null;
  userVote: VoteType | null;
  onVote: (reviewId: string, voteType: VoteType) => void;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onReport: (review: Review) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUser,
  userVote,
  onVote,
  onEdit,
  onDelete,
  onReport
}) => {
  const [voting, setVoting] = useState(false);

  const isAuthor = currentUser?.id === review.user_id;
  const canModerate = isAuthor || Boolean(currentUser?.isAdmin);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const handleVoteClick = async (type: VoteType) => {
    if (voting) return;
    setVoting(true);
    try {
      await onVote(review.id, type);
    } finally {
      setVoting(false);
    }
  };

  const isUpdated = review.updated_at && review.created_at && review.updated_at !== review.created_at;

  return (
    <article className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs">
      {/* Top Bar: Reviewer profile, rating, submission date, author actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        {/* Author Avatar & Identity */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={review.user_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(review.user_id)}`}
              alt={review.user_name}
              className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover bg-zinc-100 dark:bg-zinc-800"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center text-white" title="Verified Reviewer">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                {review.user_name}
              </h4>
              {isAuthor && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{formatDate(review.created_at)}</span>
              </span>
              {isUpdated && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                  (edited)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating Stars & Author Actions */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
          <StarRating rating={review.rating} size="sm" showValue={true} />

          {/* Edit / Delete actions for Author or Admin */}
          {canModerate && (
            <div className="flex items-center space-x-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit your review"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(review.id)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title={currentUser?.isAdmin && !isAuthor ? 'Admin: Delete inappropriate review' : 'Delete review'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Title and Comment */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-snug">
          {review.title}
        </h3>
        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
          {review.comment}
        </p>
      </div>

      {/* Review Management: Helpful, Not Helpful, Report Review */}
      <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-1 hidden sm:inline">
            Helpful evaluation?
          </span>

          {/* Helpful Button */}
          <button
            type="button"
            disabled={voting || isAuthor}
            onClick={() => handleVoteClick('helpful')}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              userVote === 'helpful'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
            title={isAuthor ? 'You cannot vote on your own review' : 'Mark as helpful'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${userVote === 'helpful' ? 'fill-current' : ''}`} />
            <span>{review.helpful_count || 0}</span>
          </button>

          {/* Not Helpful Button */}
          <button
            type="button"
            disabled={voting || isAuthor}
            onClick={() => handleVoteClick('not_helpful')}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              userVote === 'not_helpful'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
            title={isAuthor ? 'You cannot vote on your own review' : 'Mark as not helpful'}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${userVote === 'not_helpful' ? 'fill-current' : ''}`} />
            <span>{review.not_helpful_count || 0}</span>
          </button>
        </div>

        {/* Report Review Option */}
        <button
          type="button"
          onClick={() => onReport(review)}
          className="inline-flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          title="Report this review for moderator inspection"
        >
          <Flag className="w-3 h-3" />
          <span>Report</span>
        </button>
      </div>
    </article>
  );
};
