-- ==============================================================================
-- AERION Aerospace Science & Engineering Encyclopedia - Reviews & Ratings Schema
-- Migration: 20261030000000_reviews_system.sql
-- ==============================================================================

-- 1. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  item_id TEXT NOT NULL REFERENCES public.encyclopedia_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Aerospace Engineer',
  user_email VARCHAR(255),
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_item_review UNIQUE (item_id, user_id)
);

-- 2. Review Votes Table (Helpful / Not Helpful tracking)
CREATE TABLE IF NOT EXISTS public.review_votes (
  id TEXT PRIMARY KEY DEFAULT ('vote-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type VARCHAR(16) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_review_vote UNIQUE (review_id, user_id)
);

-- 3. Review Reports Table (Community moderation & flags)
CREATE TABLE IF NOT EXISTS public.review_reports (
  id TEXT PRIMARY KEY DEFAULT ('rep-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reporter_email VARCHAR(255),
  reason VARCHAR(128) NOT NULL,
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);

-- 5. Updated_at Trigger
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- 6a. Reviews Policies
DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can read all reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = 'binyamawiw@gmail.com')
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Users or admins can delete reviews" ON public.reviews;
CREATE POLICY "Users or admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = 'binyamawiw@gmail.com');

-- Also allow anon public access if using anon key in client app
DROP POLICY IF EXISTS "Anon can view published reviews" ON public.reviews;
CREATE POLICY "Anon can view published reviews"
  ON public.reviews FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "Anon can insert reviews with valid rating" ON public.reviews;
CREATE POLICY "Anon can insert reviews with valid rating"
  ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Anon can update own reviews" ON public.reviews;
CREATE POLICY "Anon can update own reviews"
  ON public.reviews FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "Anon can delete reviews" ON public.reviews;
CREATE POLICY "Anon can delete reviews"
  ON public.reviews FOR DELETE
  TO anon
  USING (true);

-- 6b. Review Votes Policies
DROP POLICY IF EXISTS "Allow select on review_votes" ON public.review_votes;
CREATE POLICY "Allow select on review_votes" ON public.review_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on review_votes" ON public.review_votes;
CREATE POLICY "Allow insert on review_votes" ON public.review_votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on review_votes" ON public.review_votes;
CREATE POLICY "Allow update on review_votes" ON public.review_votes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on review_votes" ON public.review_votes;
CREATE POLICY "Allow delete on review_votes" ON public.review_votes FOR DELETE USING (true);

-- 6c. Review Reports Policies
DROP POLICY IF EXISTS "Allow select on review_reports" ON public.review_reports;
CREATE POLICY "Allow select on review_reports" ON public.review_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on review_reports" ON public.review_reports;
CREATE POLICY "Allow insert on review_reports" ON public.review_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on review_reports" ON public.review_reports;
CREATE POLICY "Allow update on review_reports" ON public.review_reports FOR UPDATE USING (true);
