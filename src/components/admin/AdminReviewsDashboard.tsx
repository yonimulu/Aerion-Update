import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, Search, Filter, Trash2, Eye, ShieldAlert, CheckCircle2, 
  AlertTriangle, RefreshCw, MessageSquare, Check, ExternalLink,
  ChevronRight, ArrowUpDown, User
} from 'lucide-react';
import { Review, ReviewStatus } from '../../types/review';
import { RocketComponent } from '../../types/rocket';
import { ReviewService } from '../../services/reviewService';
import { StarRating } from '../reviews/StarRating';

interface AdminReviewsDashboardProps {
  components: RocketComponent[];
  onViewComponent: (id: string) => void;
  showNotification: (msg: string) => void;
}

export const AdminReviewsDashboard: React.FC<AdminReviewsDashboardProps> = ({
  components,
  onViewComponent,
  showNotification
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Platform aggregate metrics
  const [stats, setStats] = useState<{
    totalReviews: number;
    averageRating: number;
    flaggedCount: number;
    distribution: Record<number, number>;
  }>({
    totalReviews: 0,
    averageRating: 0,
    flaggedCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, platformStats] = await Promise.all([
        ReviewService.getAllReviewsForAdmin({
          search,
          filterRating,
          filterStatus
        }),
        ReviewService.getOverallPlatformStats()
      ]);
      setReviews(list);
      setStats(platformStats);
    } catch (err) {
      console.warn('Failed to load admin reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterRating, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    const res = await ReviewService.adminDeleteReview(deletingReview.id);
    if (res.success) {
      showNotification(`Deleted review "${deletingReview.title}"`);
      setDeletingReview(null);
      await loadData();
    } else {
      showNotification(res.error || 'Failed to delete review.');
    }
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    const res = await ReviewService.adminUpdateStatus(reviewId, newStatus);
    if (res.success) {
      showNotification(`Updated review status to "${newStatus}"`);
      await loadData();
    }
  };

  const getComponentName = (itemId: string) => {
    const comp = components.find(c => c.id === itemId);
    return comp ? (comp.component_name || comp.name) : itemId;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Aggregate Platform Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
            Total Reviews
          </div>
          <div className="text-2xl font-black font-mono text-zinc-950 dark:text-white">
            {stats.totalReviews}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Across all {components.length} aerospace components
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Average Platform Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-zinc-950 dark:text-white flex items-baseline space-x-2">
            <span>{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}</span>
            <span className="text-xs text-zinc-400 font-normal">/ 5.0</span>
          </div>
          <StarRating rating={stats.averageRating} size="xs" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
            Rating Breakdown
          </div>
          <div className="flex items-center space-x-1 pt-1">
            {[5, 4, 3, 2, 1].map((s) => (
              <span key={s} className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                {s}★: {stats.distribution[s] || 0}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
            {stats.distribution[5] || 0} five-star evaluations
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Moderation Flags</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-zinc-950 dark:text-white">
            {stats.flaggedCount}
          </div>
          <button
            onClick={() => {
              setFilterStatus(filterStatus === 'flagged' ? 'all' : 'flagged');
            }}
            className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer block"
          >
            {stats.flaggedCount > 0 ? 'Click to inspect reported reviews' : 'No pending flagged items'}
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reviewer, review title, comment, or component..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 font-mono focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Rating filter */}
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="flagged">Flagged / Reported</option>
            <option value="hidden">Hidden</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setFilterRating(undefined);
              setFilterStatus('all');
            }}
            className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Reviews List / Table */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
          <p className="font-mono text-xs text-zinc-500">Loading catalog reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 px-4 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-mono">No Reviews Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No evaluations match your search or filter parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 px-1">
            Showing {reviews.length} evaluation{reviews.length === 1 ? '' : 's'}:
          </div>

          {reviews.map((r) => {
            const componentName = getComponentName(r.item_id);

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                {/* Header row: component link, status, date, actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    <button
                      onClick={() => onViewComponent(r.item_id)}
                      className="group inline-flex items-center space-x-1.5 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white truncate cursor-pointer"
                      title="Inspect this component in catalog"
                    >
                      <span className="truncate">{componentName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black dark:group-hover:text-white shrink-0" />
                    </button>

                    {/* Status badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        r.status === 'published'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : r.status === 'flagged'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {/* Submission date & Admin Moderation actions */}
                  <div className="flex items-center space-x-2 text-xs font-mono shrink-0">
                    <span className="text-zinc-400 text-[11px]">{formatDate(r.created_at)}</span>

                    {/* Status toggles */}
                    {r.status !== 'published' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'published')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold"
                        title="Approve & Publish Review"
                      >
                        Publish
                      </button>
                    )}
                    {r.status !== 'hidden' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'hidden')}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-[11px]"
                        title="Hide Review from Public"
                      >
                        Hide
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingReview(r)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete review permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body: Stars, Title, Comment */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <StarRating rating={r.rating} size="sm" showValue={true} />
                    <span className="text-sm font-bold text-zinc-950 dark:text-white">
                      {r.title}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                    {r.comment}
                  </p>
                </div>

                {/* Footer: Reviewer profile details & vote statistics */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <img
                      src={r.user_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(r.user_id)}`}
                      alt={r.user_name}
                      className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700"
                    />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{r.user_name}</span>
                    {r.user_email && <span className="text-[11px] text-zinc-400">({r.user_email})</span>}
                  </div>

                  <div className="flex items-center space-x-3 text-[11px]">
                    <span>👍 Helpful: {r.helpful_count || 0}</span>
                    <span>👎 Not Helpful: {r.not_helpful_count || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white font-mono">
                Delete Inappropriate Review?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Are you sure you want to permanently delete "{deletingReview.title}" by {deletingReview.user_name}?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-3.5 py-2 text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="px-4 py-2 text-xs font-mono font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-xs"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
