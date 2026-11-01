export type ReviewStatus = 'published' | 'hidden' | 'flagged';
export type VoteType = 'helpful' | 'not_helpful';

export interface Review {
  id: string;
  item_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_avatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  status: ReviewStatus;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reporter_email?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export type ReviewSortOption = 'newest' | 'highest' | 'lowest' | 'most_helpful';
