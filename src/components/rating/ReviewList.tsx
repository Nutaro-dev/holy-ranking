import { formatDistanceToNow } from '@/lib/format-date';
import type { ProductReview } from '@/types/database';
import { AvgRatingBadge } from '@/components/rating/AvgRatingBadge';
import { User, EyeOff } from 'lucide-react';

type Props = {
  reviews: ProductReview[];
  currentUserId?: string;
};

export function ReviewList({ reviews, currentUserId }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-muted">
        Noch keine Kommentare — sei der Erste!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const isOwn = currentUserId === review.user_id;
        return (
          <article key={review.id} className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                  {review.is_anonymous ? (
                    <EyeOff className="w-4 h-4 text-muted" />
                  ) : (
                    <User className="w-4 h-4 text-[var(--line-iced-tea)]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {review.author_name}
                    {isOwn && !review.is_anonymous && (
                      <span className="text-muted font-normal"> (du)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(review.created_at)}
                  </p>
                </div>
              </div>
              {review.score != null && (
                <AvgRatingBadge score={review.score} showCount={false} size="sm" />
              )}
            </div>
            {review.review_text && (
              <p className="text-sm leading-relaxed text-foreground/90 pl-11">
                {review.review_text}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
