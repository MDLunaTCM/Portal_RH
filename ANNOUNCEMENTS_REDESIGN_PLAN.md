# Announcements Module Redesign Plan
## From Traditional Board → Facebook-like Engagement Feed

---

## Overview
Transform the announcements module into a visually rich, engagement-focused feed that supports media, reactions, comments, and analytics—while maintaining the existing HR security model (roles, permissions, RLS).

---

## Phase 1: Data Model & Database Changes

### 1.1 Extended Announcement Type
```typescript
// modules/announcements/types.ts — NEW FIELDS
export interface Announcement {
  // Existing fields
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audience: UserRole[];
  status: PublishStatus;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // NEW: Media & Author
  featured_image_url?: string;  // Hero image for feed card
  featured_image_alt?: string;
  media: AnnouncementMedia[];   // Gallery: images, videos, etc.
  author_profile: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: UserRole;
  };
  
  // NEW: Engagement
  engagement: {
    total_likes: number;
    total_comments: number;
    user_reaction?: ReactionType;  // null if user hasn't reacted
  };
}

export type ReactionType = "like" | "love" | "helpful" | "celebrate";

export interface AnnouncementMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  thumbnail_url?: string;  // For videos
  duration?: number;       // For videos, in seconds
}

export interface AnnouncementComment {
  id: string;
  announcement_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  reactions_count: number;
}

export interface AnnouncementReaction {
  id: string;
  announcement_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}
```

### 1.2 Database Tables to Add/Modify
```sql
-- Modify announcements table
ALTER TABLE announcements ADD COLUMN featured_image_url TEXT;
ALTER TABLE announcements ADD COLUMN featured_image_alt TEXT;
ALTER TABLE announcements ADD COLUMN media JSONB DEFAULT '[]';

-- NEW: announcement_reactions table
CREATE TABLE announcement_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'celebrate')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)  -- One reaction per user per announcement
);

-- NEW: announcement_comments table
CREATE TABLE announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_announcement_reactions_announcement ON announcement_reactions(announcement_id);
CREATE INDEX idx_announcement_reactions_user ON announcement_reactions(user_id);
CREATE INDEX idx_announcement_comments_announcement ON announcement_comments(announcement_id);
CREATE INDEX idx_announcement_comments_created ON announcement_comments(created_at DESC);
```

### 1.3 RLS Policies
```sql
-- Reactions: employees can see all, create their own, delete their own
ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions"
  ON announcement_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reactions"
  ON announcement_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON announcement_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: similar pattern, but HR can moderate (delete)
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments"
  ON announcement_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON announcement_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
  ON announcement_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users and HR admins can delete comments"
  ON announcement_comments FOR DELETE
  USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'hr_admin');
```

---

## Phase 2: UI Components

### 2.1 New Components Structure
```
components/
  announcements/
    ├── FeedPost.tsx                 # Main feed card (replaces AnnouncementCard)
    ├── PostHeader.tsx               # Author info + timestamp
    ├── PostContent.tsx              # Title + excerpt + category
    ├── MediaGallery.tsx             # Images/video carousel
    ├── InteractionBar.tsx           # Reactions + comments + share
    ├── ReactionsPopover.tsx         # Reaction selector
    ├── CommentsSection.tsx          # Comments list + form
    ├── CommentCard.tsx              # Individual comment
    ├── EngagementStats.tsx          # HR dashboard stats
    ├── FeaturedPostBanner.tsx       # Hero banner for pinned post
    └── FeedSkeleton.tsx             # Loading state
```

### 2.2 Component Descriptions

#### FeedPost.tsx
```tsx
interface FeedPostProps {
  announcement: Announcement;
  variant?: "feed" | "featured";  // Featured for hero, feed for grid
  onReactionChange?: (reaction: ReactionType | null) => void;
  onCommentAdd?: (comment: string) => void;
}

// Renders:
// - PostHeader (author, timestamp, menu)
// - PostContent (title, body, category badge)
// - MediaGallery (if has media)
// - InteractionBar (reactions, comments, share)
```

#### MediaGallery.tsx
```tsx
interface MediaGalleryProps {
  media: AnnouncementMedia[];
  featured_image?: string;
}

// Features:
// - Lightbox for images (click to expand)
// - Video player with thumbnail
// - Carousel for multiple images
// - Responsive grid (1-4 items depending on layout)
```

#### InteractionBar.tsx
```tsx
// Shows:
// - Reaction buttons with emoji (Like ❤️ | Love ✨ | Helpful ✓ | Celebrate 🎉)
// - Comments count (clickable to expand)
// - Share button
// - HR admins: view engagement stats
```

#### CommentsSection.tsx
```tsx
// Features:
// - Nested comments (replies to comments)
// - Comment form with textarea
// - Chronological order (newest first? configurable)
// - Load more / pagination
```

#### EngagementStats.tsx (HR dashboard)
```tsx
// For HR admins only
// - Total reactions breakdown (pie chart)
// - Comments timeline
// - View count (if analytics enabled)
// - Best posts this week
```

### 2.3 Color & Style System (Following reglas_diseno.md)

**Card Design:**
```
- bg-card (white in light, dark card in dark mode)
- border-border with subtle box-shadow
- border-primary/20 on hover
- Rounded corners (--radius: 0.3rem)
```

**Engagement Colors:**
```
- Like: red/destructive (oklch(0.577 0.245 27.325))
- Love: pink/primary (oklch(0.62 0.2212 25.56))
- Helpful: success/green (oklch(0.546 0.153 142.495))
- Celebrate: warning/amber (oklch(0.828 0.189 84.429))
```

**Typography:**
```
- Post title: text-lg font-semibold text-foreground
- Body: text-sm text-foreground (preserve formatting)
- Author: text-sm font-medium text-foreground
- Timestamp: text-xs text-muted-foreground
- Comment: text-sm text-foreground
```

---

## Phase 3: Layout & Flows

### 3.1 Announcements Page Redesign

**Desktop (≥1024px):**
```
┌─────────────────────────────────────────┐
│ Page Header (Tablón de Anuncios)        │
├─────────────────────────────────────────┤
│ [Search] [Category Filter] [Clear]      │  ← Filters same as before
├─────────────────────────────────────────┤
│  FEATURED POST (if pinned/urgent)       │
│  ┌─────────────────────────────────────┐│
│  │ [Large media] Author | 2h ago       ││
│  │ Title                               ││
│  │ Body excerpt (full width)           ││
│  │ [❤️ 234] [💬 12] [Share]           ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│ FEED GRID (2-3 columns on desktop)      │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ Author | 4h  │ │ Author | 1h  │      │
│ │ Title        │ │ Title        │      │
│ │ Body         │ │ Body         │      │
│ │ [image]      │ │ [image]      │      │
│ │ [❤️][💬][📤]│ │ [❤️][💬][📤]│      │
│ └──────────────┘ └──────────────┘      │
└─────────────────────────────────────────┘
```

**Mobile (<768px):**
```
Single column, full-width feed (stack)
Featured post takes full width
```

### 3.2 Interaction Flows

**Liking an announcement:**
```
User hovers/clicks reaction button → PopoverReactions shows
User selects reaction → ADD to announcement_reactions table
Button highlights with selected emoji + count increments
Server action handles persistence + RLS
```

**Commenting:**
```
User clicks "Comments" or comment count → CommentsSection expands/modal opens
User types comment → Submit button enables
Server action creates announcement_comments record
Comment appears optimistically in UI
List refreshes with new comment
```

**Sharing:**
```
Click share button → Show modal with:
- Copy link
- Share to email (if configured)
- Share to teams/slack (if integrated)
```

---

## Phase 4: Server Actions & Hooks

### 4.1 New Server Actions
```typescript
// modules/announcements/actions.ts — ADD THESE

// Reactions
export async function addAnnouncementReaction(
  announcementId: string,
  reactionType: ReactionType
): Promise<{ success: boolean; error?: string }>

export async function removeAnnouncementReaction(
  announcementId: string
): Promise<{ success: boolean; error?: string }>

// Comments
export async function addAnnouncementComment(
  announcementId: string,
  content: string
): Promise<{ success: boolean; comment?: AnnouncementComment; error?: string }>

export async function deleteAnnouncementComment(
  commentId: string
): Promise<{ success: boolean; error?: string }>

export async function listAnnouncementComments(
  announcementId: string,
  limit?: number
): Promise<{ comments: AnnouncementComment[]; error?: string }>

// Analytics (HR only)
export async function getAnnouncementEngagement(
  announcementId: string
): Promise<{ engagement: EngagementStats; error?: string }>

export async function getEngagementOverview(
  dateRange?: { from: string; to: string }
): Promise<{ stats: EngagementStats[]; error?: string }>
```

### 4.2 New Hooks
```typescript
// modules/announcements/hooks/use-announcement-reactions.ts
export function useAnnouncementReactions(announcementId: string) {
  // Manages reaction state, optimistic updates
  // Handles adding/removing reactions
}

// modules/announcements/hooks/use-announcement-comments.ts
export function useAnnouncementComments(announcementId: string) {
  // Manages comments list
  // Pagination support
  // Optimistic comment creation
}

// modules/announcements/hooks/use-announcement-engagement.ts (HR)
export function useAnnouncementEngagement(announcementId: string) {
  // For HR dashboard
  // Reactions breakdown, comments timeline
}
```

---

## Phase 5: Migration Strategy

### 5.1 Backwards Compatibility
- Existing announcements without media still render (just title + body)
- Simple graceful degradation
- Featured image is optional

### 5.2 Rollout Plan
1. **Week 1:** Add database changes + types + new UI components (no page changes)
2. **Week 2:** Implement new hooks + server actions
3. **Week 3:** Update announcements page layout + test
4. **Week 4:** Polish, animations, performance, A/B test if needed

### 5.3 Testing Checklist
- [ ] RLS policies prevent unauthorized reactions/comments
- [ ] HR admins see engagement stats
- [ ] Employees can only interact (like/comment) on visible announcements
- [ ] Media loads properly (images, videos)
- [ ] Comments are editable by author, deletable by HR
- [ ] Mobile responsive
- [ ] Performance: handle 1000+ reactions without lag
- [ ] Dark mode works correctly

---

## Phase 6: Future Enhancements (Post-MVP)

- [ ] Notification when announcement gets reactions/comments
- [ ] Announcement "trending" badge
- [ ] Admin: bulk email digest of popular announcements
- [ ] Comment replies/threading
- [ ] Emoji picker for more reaction types
- [ ] Analytics dashboard (charts, heatmaps)
- [ ] Content moderation (flag inappropriate comments)
- [ ] Full-text search in comments

---

## Estimated Effort
- Phase 1-2 (DB + UI): 4-5 days
- Phase 3-4 (Logic + Hooks): 3-4 days
- Phase 5-6 (Integration + Polish): 2-3 days
- **Total: 9-12 days** (can be parallelized with team)

---

## Brand Alignment
✅ Orange/terracota primary color maintained
✅ Follows reglas_diseno.md design system
✅ shadcn/ui components + Tailwind CSS
✅ Dark mode support
✅ HR-focused analytics (not consumer social media)
✅ Security-first (RLS, role-based access)

---

## Success Metrics
- Announcements are 40% more visually engaging
- Comment/reaction rate increases by 3x
- Employee engagement time per announcement increases
- HR can measure announcement effectiveness
- Mobile usability improves significantly
