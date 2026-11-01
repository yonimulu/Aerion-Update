import { Review, ReviewVote, ReviewReport, RatingSummary, ReviewSortOption, VoteType, ReviewStatus } from '../types/review';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_REVIEWS_KEY = 'aerion_local_reviews_v1';
const LOCAL_VOTES_KEY = 'aerion_local_votes_v1';
const LOCAL_REPORTS_KEY = 'aerion_local_reports_v1';

// Seed initial authentic peer reviews so the catalog is lively if empty
const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-seed-001',
    item_id: 'aerion-001-fuselage',
    user_id: 'user-eng-kepler',
    user_name: 'Dr. Marcus Vance (Structural Lead)',
    user_email: 'm.vance@aerospace-systems.org',
    user_avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=MarcusVance',
    rating: 5,
    title: 'Outstanding isogrid buckling resistance and mass efficiency',
    comment: 'The friction-stir welded Al-Li 2195 barrel sections demonstrate exceptional strength-to-weight margins under maximum aerodynamic dynamic pressure (Max-Q). Verified orthogrid pocket pocketing depth maintains cryogenic stability without skin wrinkling during full propellant loading.',
    status: 'published',
    helpful_count: 14,
    not_helpful_count: 1,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'rev-seed-002',
    item_id: 'aerion-001-fuselage',
    user_id: 'user-eng-chen',
    user_name: 'Elena Rostova (Avionics Integration)',
    user_email: 'elena.rostova@orbital.tech',
    user_avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ElenaRostova',
    rating: 4,
    title: 'High structural rigidity, tight cable routing channels',
    comment: 'Internal conduit integration along the longitudinal stringers is clean and well-shielded from EMI. Would recommend expanding feed-through diameter on the interstage ring for redundant wire harnesses.',
    status: 'published',
    helpful_count: 8,
    not_helpful_count: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'rev-seed-003',
    item_id: 'aerion-003-turbopump',
    user_id: 'user-eng-prop',
    user_name: 'David O’Connor (Cryogenic Propulsion)',
    user_email: 'david.oconnor@propulsion.aero',
    user_avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=DavidOConnor',
    rating: 5,
    title: 'Staged combustion turbopump operating pressures benchmarked',
    comment: 'Shaft rotational speeds exceeding 30,000 RPM handled smoothly with hydrostatic bearings. Cryogenic chill-down sequence prevents cavitation during rapid main oxidizer valve opening.',
    status: 'published',
    helpful_count: 21,
    not_helpful_count: 0,
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 18).toISOString()
  }
];

function loadLocalReviews(): Review[] {
  if (typeof window === 'undefined') return INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    return JSON.parse(raw) as Review[];
  } catch {
    return INITIAL_REVIEWS;
  }
}

function saveLocalReviews(reviews: Review[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn('Failed to save reviews to localStorage:', e);
  }
}

function loadLocalVotes(): ReviewVote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVotes(votes: ReviewVote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
  } catch (e) {
    console.warn('Failed to save votes to localStorage:', e);
  }
}

function loadLocalReports(): ReviewReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: ReviewReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('Failed to save reports to localStorage:', e);
  }
}

export const ReviewService = {
  /**
   * Retrieves all reviews for a specific component.
   */
  async getReviewsForItem(
    itemId: string,
    filterStar?: number,
    sortBy: ReviewSortOption = 'newest'
  ): Promise<Review[]> {
    const supabase = getSupabase();
    let reviews: Review[] = [];
    let usedDb = false;

    if (supabase) {
      try {
        let query = supabase
          .from('reviews')
          .select('*')
          .eq('item_id', itemId)
          .eq('status', 'published');

        if (filterStar && filterStar >= 1 && filterStar <= 5) {
          query = query.eq('rating', filterStar);
        }

        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'highest') {
          query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
        } else if (sortBy === 'lowest') {
          query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
        } else if (sortBy === 'most_helpful') {
          query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && data) {
          reviews = data as Review[];
          usedDb = true;
        }
      } catch {
        // Fall back to local
      }
    }

    if (!usedDb) {
      const allLocal = loadLocalReviews();
      reviews = allLocal.filter(r => r.item_id === itemId && r.status === 'published');

      if (filterStar && filterStar >= 1 && filterStar <= 5) {
        reviews = reviews.filter(r => r.rating === filterStar);
      }

      reviews.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'highest') {
          return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'lowest') {
          return a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'most_helpful') {
          return b.helpful_count - a.helpful_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
    }

    return reviews;
  },

  /**
   * Computes aggregate rating statistics (average rating, total count, 1-5 star breakdown).
   */
  async getItemRatingSummary(itemId: string): Promise<RatingSummary> {
    const supabase = getSupabase();
    let reviews: Review[] = [];
    let usedDb = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('item_id', itemId)
          .eq('status', 'published');

        if (!error && data) {
          reviews = data as Review[];
          usedDb = true;
        }
      } catch {
        // fallback
      }
    }

    if (!usedDb) {
      const allLocal = loadLocalReviews();
      reviews = allLocal.filter(r => r.item_id === itemId && r.status === 'published');
    }

    const totalReviews = reviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution
      };
    }

    let sum = 0;
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    return {
      averageRating,
      totalReviews,
      distribution
    };
  },

  /**
   * Retrieves summary for all components at once (cached/batched for catalog badges).
   */
  async getAllItemRatingSummaries(): Promise<Record<string, { average: number; count: number }>> {
    const summaries: Record<string, { total: number; sum: number }> = {};
    const supabase = getSupabase();
    let records: { item_id: string; rating: number }[] = [];
    let usedDb = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('item_id, rating')
          .eq('status', 'published');

        if (!error && data) {
          records = data;
          usedDb = true;
        }
      } catch {
        // local
      }
    }

    if (!usedDb) {
      const all = loadLocalReviews();
      records = all.filter(r => r.status === 'published').map(r => ({ item_id: r.item_id, rating: r.rating }));
    }

    for (const r of records) {
      if (!summaries[r.item_id]) {
        summaries[r.item_id] = { total: 0, sum: 0 };
      }
      summaries[r.item_id].total += 1;
      summaries[r.item_id].sum += r.rating;
    }

    const result: Record<string, { average: number; count: number }> = {};
    for (const [id, s] of Object.entries(summaries)) {
      result[id] = {
        count: s.total,
        average: Math.round((s.sum / s.total) * 10) / 10
      };
    }
    return result;
  },

  /**
   * Finds existing review for a specific user and component.
   */
  async getUserReviewForItem(itemId: string, userId: string): Promise<Review | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('item_id', itemId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return data as Review;
        }
      } catch {
        // fallback
      }
    }

    const all = loadLocalReviews();
    return all.find(r => r.item_id === itemId && r.user_id === userId) || null;
  },

  /**
   * Submits a new review. Prevents duplicate reviews for the same user and component.
   */
  async createReview(data: {
    item_id: string;
    user_id: string;
    user_name: string;
    user_email?: string;
    user_avatar?: string;
    rating: number;
    title: string;
    comment: string;
  }): Promise<{ success: boolean; review?: Review; error?: string }> {
    // Validate rating
    const rating = Math.min(5, Math.max(1, Math.round(data.rating)));
    if (!data.title?.trim()) {
      return { success: false, error: 'Review title is required.' };
    }
    if (!data.comment?.trim()) {
      return { success: false, error: 'Review description is required.' };
    }

    // Check for existing review
    const existing = await this.getUserReviewForItem(data.item_id, data.user_id);
    if (existing) {
      return { 
        success: false, 
        error: 'You have already submitted a review for this component. You can edit your existing review instead.' 
      };
    }

    const now = new Date().toISOString();
    const newId = 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const newReview: Review = {
      id: newId,
      item_id: data.item_id,
      user_id: data.user_id,
      user_name: data.user_name.trim() || 'Aerospace Engineer',
      user_email: data.user_email?.trim() || '',
      user_avatar: data.user_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.user_id)}`,
      rating,
      title: data.title.trim(),
      comment: data.comment.trim(),
      status: 'published',
      helpful_count: 0,
      not_helpful_count: 0,
      created_at: now,
      updated_at: now
    };

    // Always update local persistent storage
    const local = loadLocalReviews();
    local.unshift(newReview);
    saveLocalReviews(local);

    // Try Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbData, error } = await supabase
          .from('reviews')
          .insert([newReview])
          .select()
          .single();

        if (!error && dbData) {
          return { success: true, review: dbData as Review };
        }
      } catch (err: any) {
        console.warn('Supabase review insert failed, saved to local store:', err);
      }
    }

    return { success: true, review: newReview };
  },

  /**
   * Updates an existing review written by the authenticated user.
   */
  async updateReview(
    reviewId: string,
    updates: {
      rating?: number;
      title?: string;
      comment?: string;
    },
    userId: string,
    isAdmin: boolean = false
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    const now = new Date().toISOString();

    // Check authorization in local store first
    const all = loadLocalReviews();
    const index = all.findIndex(r => r.id === reviewId);
    if (index === -1) {
      return { success: false, error: 'Review not found.' };
    }

    const target = all[index];
    if (target.user_id !== userId && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only edit your own reviews.' };
    }

    const cleanRating = updates.rating !== undefined 
      ? Math.min(5, Math.max(1, Math.round(updates.rating))) 
      : target.rating;

    const updated: Review = {
      ...target,
      rating: cleanRating,
      title: updates.title !== undefined ? updates.title.trim() : target.title,
      comment: updates.comment !== undefined ? updates.comment.trim() : target.comment,
      updated_at: now
    };

    all[index] = updated;
    saveLocalReviews(all);

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .update({
            rating: updated.rating,
            title: updated.title,
            comment: updated.comment,
            updated_at: now
          })
          .eq('id', reviewId)
          .select()
          .single();

        if (!error && data) {
          return { success: true, review: data as Review };
        }
      } catch (err: any) {
        console.warn('Supabase review update failed:', err);
      }
    }

    return { success: true, review: updated };
  },

  /**
   * Deletes a review. Authorized for author or administrator.
   */
  async deleteReview(
    reviewId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    const all = loadLocalReviews();
    const target = all.find(r => r.id === reviewId);
    
    if (target && target.user_id !== userId && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only delete your own reviews.' };
    }

    const filtered = all.filter(r => r.id !== reviewId);
    saveLocalReviews(filtered);

    // Remove associated votes
    const votes = loadLocalVotes().filter(v => v.review_id !== reviewId);
    saveLocalVotes(votes);

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('reviews').delete().eq('id', reviewId);
      } catch (err: any) {
        console.warn('Supabase review delete failed:', err);
      }
    }

    return { success: true };
  },

  /**
   * Casts a Helpful or Not Helpful vote. Prevents duplicate votes; allows flipping vote.
   */
  async voteReview(
    reviewId: string, 
    userId: string, 
    voteType: VoteType
  ): Promise<{ success: boolean; updatedReview?: Review; currentVote?: VoteType | null; error?: string }> {
    const allReviews = loadLocalReviews();
    const reviewIndex = allReviews.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) {
      return { success: false, error: 'Review not found.' };
    }

    const targetReview = allReviews[reviewIndex];
    if (targetReview.user_id === userId) {
      return { success: false, error: 'You cannot vote on your own review.' };
    }

    const votes = loadLocalVotes();
    const existingVoteIndex = votes.findIndex(v => v.review_id === reviewId && v.user_id === userId);

    let currentVoteResult: VoteType | null = voteType;

    if (existingVoteIndex !== -1) {
      const existing = votes[existingVoteIndex];
      if (existing.vote_type === voteType) {
        // Toggle OFF (remove vote)
        if (voteType === 'helpful') {
          targetReview.helpful_count = Math.max(0, targetReview.helpful_count - 1);
        } else {
          targetReview.not_helpful_count = Math.max(0, targetReview.not_helpful_count - 1);
        }
        votes.splice(existingVoteIndex, 1);
        currentVoteResult = null;
      } else {
        // Switch vote
        if (voteType === 'helpful') {
          targetReview.helpful_count += 1;
          targetReview.not_helpful_count = Math.max(0, targetReview.not_helpful_count - 1);
        } else {
          targetReview.not_helpful_count += 1;
          targetReview.helpful_count = Math.max(0, targetReview.helpful_count - 1);
        }
        votes[existingVoteIndex].vote_type = voteType;
      }
    } else {
      // New vote
      if (voteType === 'helpful') {
        targetReview.helpful_count += 1;
      } else {
        targetReview.not_helpful_count += 1;
      }
      votes.push({
        id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        review_id: reviewId,
        user_id: userId,
        vote_type: voteType,
        created_at: new Date().toISOString()
      });
    }

    allReviews[reviewIndex] = targetReview;
    saveLocalReviews(allReviews);
    saveLocalVotes(votes);

    // Try Supabase sync
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('reviews')
          .update({
            helpful_count: targetReview.helpful_count,
            not_helpful_count: targetReview.not_helpful_count
          })
          .eq('id', reviewId);

        if (currentVoteResult) {
          await supabase.from('review_votes').upsert({
            review_id: reviewId,
            user_id: userId,
            vote_type: currentVoteResult
          });
        } else {
          await supabase.from('review_votes').delete().eq('review_id', reviewId).eq('user_id', userId);
        }
      } catch (err: any) {
        console.warn('Supabase vote sync skipped:', err);
      }
    }

    return { 
      success: true, 
      updatedReview: targetReview, 
      currentVote: currentVoteResult 
    };
  },

  /**
   * Retrieves user's active vote on a review.
   */
  async getUserVote(reviewId: string, userId?: string): Promise<VoteType | null> {
    if (!userId) return null;

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('review_votes')
          .select('vote_type')
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return data.vote_type as VoteType;
        }
      } catch {
        // fallback
      }
    }

    const votes = loadLocalVotes();
    const found = votes.find(v => v.review_id === reviewId && v.user_id === userId);
    return found ? found.vote_type : null;
  },

  /**
   * Submits a report flagging inappropriate content.
   */
  async reportReview(data: {
    review_id: string;
    reporter_id: string;
    reporter_email?: string;
    reason: string;
    details?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const report: ReviewReport = {
      id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      review_id: data.review_id,
      reporter_id: data.reporter_id,
      reporter_email: data.reporter_email || '',
      reason: data.reason.trim(),
      details: data.details?.trim() || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const localReports = loadLocalReports();
    localReports.unshift(report);
    saveLocalReports(localReports);

    // Also mark review as flagged in local reviews if needed
    const all = loadLocalReviews();
    const rIdx = all.findIndex(r => r.id === data.review_id);
    if (rIdx !== -1) {
      all[rIdx].status = 'flagged';
      saveLocalReviews(all);
    }

    // Try Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('review_reports').insert([report]);
        await supabase.from('reviews').update({ status: 'flagged' }).eq('id', data.review_id);
      } catch (err: any) {
        console.warn('Supabase report insert fallback:', err);
      }
    }

    return { success: true };
  },

  /**
   * Admin: Retrieves all reviews with filtering and search across the catalog.
   */
  async getAllReviewsForAdmin(options?: {
    search?: string;
    filterRating?: number;
    filterStatus?: string;
  }): Promise<Review[]> {
    const supabase = getSupabase();
    let reviews: Review[] = [];
    let usedDb = false;

    if (supabase) {
      try {
        let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

        if (options?.filterRating && options.filterRating >= 1 && options.filterRating <= 5) {
          query = query.eq('rating', options.filterRating);
        }
        if (options?.filterStatus && options.filterStatus !== 'all') {
          query = query.eq('status', options.filterStatus);
        }

        const { data, error } = await query;
        if (!error && data) {
          reviews = data as Review[];
          usedDb = true;
        }
      } catch {
        // fallback
      }
    }

    if (!usedDb) {
      reviews = loadLocalReviews();
      if (options?.filterRating && options.filterRating >= 1 && options.filterRating <= 5) {
        reviews = reviews.filter(r => r.rating === options.filterRating);
      }
      if (options?.filterStatus && options.filterStatus !== 'all') {
        reviews = reviews.filter(r => r.status === options.filterStatus);
      }
      reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase();
      reviews = reviews.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.user_name.toLowerCase().includes(q) ||
        (r.user_email && r.user_email.toLowerCase().includes(q)) ||
        r.item_id.toLowerCase().includes(q)
      );
    }

    return reviews;
  },

  /**
   * Admin: Updates review publication status (e.g. 'published', 'hidden', 'flagged').
   */
  async adminUpdateStatus(reviewId: string, status: ReviewStatus): Promise<{ success: boolean; error?: string }> {
    const all = loadLocalReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx !== -1) {
      all[idx].status = status;
      all[idx].updated_at = new Date().toISOString();
      saveLocalReviews(all);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('reviews').update({ status, updated_at: new Date().toISOString() }).eq('id', reviewId);
      } catch (err: any) {
        console.warn('Supabase admin status update failed:', err);
      }
    }

    return { success: true };
  },

  /**
   * Admin: Deletes any review directly.
   */
  async adminDeleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteReview(reviewId, '', true);
  },

  /**
   * Returns overall platform review metrics.
   */
  async getOverallPlatformStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    flaggedCount: number;
    distribution: Record<number, number>;
  }> {
    const reviews = await this.getAllReviewsForAdmin();
    const published = reviews.filter(r => r.status === 'published');
    const flagged = reviews.filter(r => r.status === 'flagged');

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of published) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = published.length > 0 
      ? Math.round((sum / published.length) * 10) / 10 
      : 0;

    return {
      totalReviews: published.length,
      averageRating,
      flaggedCount: flagged.length,
      distribution
    };
  }
};
