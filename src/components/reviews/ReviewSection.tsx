import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, MessageSquare, Filter, ArrowUpDown, Plus, 
  RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, 
  Trash2, X, ChevronDown, Check
} from 'lucide-react';
import { Review, RatingSummary, ReviewSortOption, VoteType } from '../../types/review';
import { ReviewService } from '../../services/reviewService';
import { AuthService, AppUser } from '../../services/authService';
import { RatingBreakdown } from './RatingBreakdown';
import { ReviewCard } from './ReviewCard';
import { ReviewFormCard } from './ReviewFormCard';
import { ReportModal } from './ReportModal';
import { AuthPromptModal } from './AuthPromptModal';

interface ReviewSectionProps {
  itemId: string;
  componentName: string;
}

const PAGE_SIZE = 4;

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  itemId,
  componentName
}) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, VoteType | null>>({});

  // Filtering and Sorting state
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial auth user loading
  useEffect(() => {
    AuthService.getCurrentUser().then(user => setCurrentUser(user));
    const sub = AuthService.onAuthStateChange(user => setCurrentUser(user));
    return () => sub.unsubscribe();
  }, []);

  // 2. Load reviews & summary
  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, list] = await Promise.all([
        ReviewService.getItemRatingSummary(itemId),
        ReviewService.getReviewsForItem(itemId, selectedStarFilter, sortBy)
      ]);
      setSummary(sum);
      setReviews(list);

      // Load active votes for current user
      if (currentUser?.id) {
        const votesMap: Record<string, VoteType | null> = {};
        for (const r of list) {
          const v = await ReviewService.getUserVote(r.id, currentUser.id);
          votesMap[r.id] = v;
        }
        setUserVotes(votesMap);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId, selectedStarFilter, sortBy, currentUser?.id]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  // Check if current user has already reviewed this item
  const userExistingReview = currentUser 
    ? reviews.find(r => r.user_id === currentUser.id || (currentUser.email && r.user_email?.toLowerCase() === currentUser.email.toLowerCase())) || null
    : null;

  const handleOpenWriteReview = () => {
    // Anyone can review immediately without signing up or signing in
    setEditingReview(userExistingReview);
    setIsFormOpen((prev) => !prev);
  };

  const handleSubmitReviewForm = async (data: { name: string; email: string; rating: number; title: string; comment: string }) => {
    // Hold/create the user profile using their submitted name & email without requiring an account or password
    const user = AuthService.getOrCreateGuestUser(data.name, data.email);
    setCurrentUser(user);

    if (editingReview) {
      const res = await ReviewService.updateReview(
        editingReview.id,
        {
          rating: data.rating,
          title: data.title,
          comment: data.comment
        },
        user.id,
        user.isAdmin
      );
      if (res.success) {
        showToast('Your review has been updated.');
        await loadReviewsData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = await ReviewService.createReview({
        item_id: itemId,
        user_id: user.id,
        user_name: data.name,
        user_email: data.email,
        user_avatar: user.avatarUrl,
        rating: data.rating,
        title: data.title,
        comment: data.comment
      });

      if (res.success) {
        showToast('Your review has been submitted successfully.');
        await loadReviewsData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleVote = async (reviewId: string, voteType: VoteType) => {
    const user = currentUser || AuthService.getOrCreateGuestUser();
    setCurrentUser(user);

    const res = await ReviewService.voteReview(reviewId, user.id, voteType);
    if (res.success) {
      setUserVotes(prev => ({
        ...prev,
        [reviewId]: res.currentVote ?? null
      }));
      if (res.updatedReview) {
        setReviews(prev => prev.map(r => r.id === reviewId ? res.updatedReview! : r));
      }
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReviewId || !currentUser) return;
    const res = await ReviewService.deleteReview(
      deletingReviewId,
      currentUser.id,
      currentUser.isAdmin
    );
    if (res.success) {
      showToast('Review deleted successfully.');
      setDeletingReviewId(null);
      await loadReviewsData();
    } else {
      showToast(res.error || 'Failed to delete review.');
    }
  };

  const handleReportSubmit = async (reviewId: string, reason: string, details?: string) => {
    const user = currentUser || AuthService.getOrCreateGuestUser();
    setCurrentUser(user);
    await ReviewService.reportReview({
      review_id: reviewId,
      reporter_id: user.id,
      reporter_email: user.email,
      reason,
      details
    });
    showToast('Review reported to engineering moderators.');
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  return (
    <section className="space-y-8 pt-8 border-t border-zinc-200 dark:border-zinc-800" id="reviews-section">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl shadow-xl font-mono text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
              Peer Evaluations
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white font-mono mt-1">
            Engineering Reviews & Ratings
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Verified flight observations, mechanical integration feedback, and technical assessments from aerospace professionals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenWriteReview}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Star className="w-4 h-4 fill-current text-amber-400" />
          <span>{isFormOpen ? 'Cancel' : userExistingReview ? 'Edit Your Review' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Inline Native Webapp Review Form (Action opened right on top - No Popups) */}
      {isFormOpen && (
        <ReviewFormCard
          onClose={() => {
            setIsFormOpen(false);
            setEditingReview(null);
          }}
          onSubmit={handleSubmitReviewForm}
          currentUser={currentUser}
          existingReview={editingReview}
          componentName={componentName}
        />
      )}

      {/* 2. Rating Breakdown Bar Component */}
      <RatingBreakdown
        summary={summary}
        selectedStarFilter={selectedStarFilter}
        onSelectStarFilter={(star) => {
          setSelectedStarFilter(star);
          setVisibleCount(PAGE_SIZE);
        }}
        onWriteReviewClick={handleOpenWriteReview}
        hasUserReviewed={Boolean(userExistingReview)}
      />

      {/* 3. Review Management Toolbar: Star Filters & Sort Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
        {/* Star Rating Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-500 mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </span>

          <button
            onClick={() => { setSelectedStarFilter(undefined); setVisibleCount(PAGE_SIZE); }}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              selectedStarFilter === undefined
                ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white'
            }`}
          >
            All ({summary.totalReviews})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => { setSelectedStarFilter(selectedStarFilter === s ? undefined : s); setVisibleCount(PAGE_SIZE); }}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-colors cursor-pointer ${
                selectedStarFilter === s
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-zinc-400 text-[10px]">({summary.distribution[s as 1|2|3|4|5] || 0})</span>
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as ReviewSortOption);
              setVisibleCount(PAGE_SIZE);
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-md px-2.5 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* 4. Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
            <p className="font-mono text-xs text-zinc-500">Retrieving engineering evaluations...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-6 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-mono">
              {selectedStarFilter ? `No ${selectedStarFilter}-Star Reviews Found` : 'No Engineering Reviews Yet'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              {selectedStarFilter
                ? 'Try clearing the star rating filter to see evaluations across all ratings.'
                : 'Be the first aerospace systems engineer to evaluate this rocket component and document flight observations.'}
            </p>
            {selectedStarFilter ? (
              <button
                onClick={() => setSelectedStarFilter(undefined)}
                className="mt-2 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Clear Star Filter
              </button>
            ) : (
              <button
                onClick={handleOpenWriteReview}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write the First Review</span>
              </button>
            )}
          </div>
        ) : (
          /* Reviews Cards */
          <>
            <div className="space-y-4">
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUser={currentUser}
                  userVote={userVotes[review.id] ?? null}
                  onVote={handleVote}
                  onEdit={(r) => {
                    setEditingReview(r);
                    setIsFormOpen(true);
                  }}
                  onDelete={(id) => setDeletingReviewId(id)}
                  onReport={(r) => setReportingReview(r)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Load More Reviews ({reviews.length - visibleCount} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>


      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          showToast(`Signed in as ${user.name}`);
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(reportingReview)}
        review={reportingReview}
        onClose={() => setReportingReview(null)}
        onSubmitReport={handleReportSubmit}
      />

      {/* Delete Confirmation Modal */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white font-mono">
                Delete Review?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Are you sure you want to remove this evaluation? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReviewId(null)}
                className="px-3.5 py-2 text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-mono font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
