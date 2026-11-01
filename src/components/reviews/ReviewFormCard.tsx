import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, User, Mail, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { Review } from '../../types/review';
import { AppUser } from '../../services/authService';

export interface ReviewFormData {
  name: string;
  email: string;
  rating: number;
  title: string;
  comment: string;
}

interface ReviewFormCardProps {
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => Promise<{ success: boolean; error?: string }>;
  currentUser: AppUser | null;
  existingReview?: Review | null;
  componentName: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: '5 Stars - Outstanding / Mission-Critical Excellence',
  4: '4 Stars - Very Good / Highly Recommended',
  3: '3 Stars - Good / Standard Flight Performance',
  2: '2 Stars - Fair / Notable Integration Limitations',
  1: '1 Star - Critical Issues / Engineering Concerns'
};

export const ReviewFormCard: React.FC<ReviewFormCardProps> = ({
  onClose,
  onSubmit,
  currentUser,
  existingReview,
  componentName
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingReview) {
      setName(existingReview.user_name || '');
      setEmail(existingReview.user_email || '');
      setRating(existingReview.rating || 5);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    } else {
      setName(currentUser?.name || '');
      setEmail(currentUser?.email || '');
      setRating(5);
      setTitle('');
      setComment('');
    }
    setError(null);
  }, [existingReview, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a short headline or summary.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write your review message or observations.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating,
        title: title.trim(),
        comment: comment.trim()
      });

      if (!res.success) {
        setError(res.error || 'Failed to submit review.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
      <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>{existingReview ? 'Update Evaluation' : 'Community Review & Rating'}</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white font-mono mt-0.5">
            {existingReview ? 'Edit Your Evaluation' : 'Submit Engineering Review'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Hardware: <span className="font-semibold text-black dark:text-white">{componentName}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Close review form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reviewer Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Your Name:</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>Your Email:</span>
            </label>
            <input
              type="email"
              required
              maxLength={150}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
            />
          </div>
        </div>

        {/* Star Rating Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
            <span>Overall Rating (1 to 5 Stars):</span>
            <span className="text-amber-500 font-bold text-xs">{rating} of 5 Stars</span>
          </label>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-1.5">
            <StarRating
              rating={rating}
              interactive={true}
              onChange={setRating}
              size="lg"
            />
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 text-center">
              {RATING_DESCRIPTIONS[rating] || `${rating} Stars`}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
            Review Headline:
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Exceptional reliability under cryogenic test conditions"
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
          />
        </div>

        {/* Comment / Message */}
        <div className="space-y-1">
          <label className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
            <span>Your Review Message:</span>
            <span className="text-[10px] text-zinc-400 font-mono">{comment.length} characters</span>
          </label>
          <textarea
            required
            rows={4}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts, observations, operating performance, or test feedback..."
            className="w-full text-xs p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white leading-relaxed font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-mono font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Saving Review...' : existingReview ? 'Save Changes' : 'Submit Review'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
