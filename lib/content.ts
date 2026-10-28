import { db } from "./db";
import type { HomeCard } from "./compose";

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  topic: string;
  tags: string;
  cover: string;
  body: string;
  published_at: string;
};

export type Resource = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  body: string;
  prompt: string;
  icon: string;
  cover: string;
};

export type Post = {
  id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  image_key: string | null;
  topic: string;
  status: string;
  review_note: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  status: string;
  created_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  summary: string;
  theme: string;
  starts_at: string;
  place: string;
  host_name: string;
  status: string;
  proposed_by: string | null;
  created_at: string;
  rsvp_count: number;
};

export async function listArticles() {
  const rows = await db().prepare("SELECT * FROM articles ORDER BY published_at DESC").all<Article>();
  return rows.results;
}

export async function getArticle(slug: string) {
  return db().prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).first<Article>();
}

export async function listResources() {
  const rows = await db().prepare("SELECT * FROM resources ORDER BY title").all<Resource>();
  return rows.results;
}

export async function getResource(slug: string) {
  return db().prepare("SELECT * FROM resources WHERE slug = ?").bind(slug).first<Resource>();
}

export async function listPosts() {
  const rows = await db()
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'visible') AS comment_count
       FROM posts p WHERE p.status = 'visible' ORDER BY p.created_at DESC`,
    )
    .all<Post>();
  return rows.results;
}

export async function getPost(id: string) {
  return db()
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'visible') AS comment_count
       FROM posts p WHERE p.id = ?`,
    )
    .bind(id)
    .first<Post>();
}

export async function listComments(postId: string) {
  const rows = await db()
    .prepare("SELECT * FROM comments WHERE post_id = ? AND status = 'visible' ORDER BY created_at ASC")
    .bind(postId)
    .all<Comment>();
  return rows.results;
}

export async function liked(postId: string, userId: string | undefined) {
  if (!userId) return false;
  const row = await db()
    .prepare("SELECT 1 AS ok FROM likes WHERE post_id = ? AND user_id = ?")
    .bind(postId, userId)
    .first<{ ok: number }>();
  return Boolean(row);
}

export async function listEvents() {
  const rows = await db()
    .prepare(
      `SELECT e.*, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) AS rsvp_count
       FROM events e WHERE e.status = 'approved' ORDER BY e.starts_at ASC`,
    )
    .all<EventRow>();
  return rows.results;
}

export async function getEvent(id: string) {
  return db()
    .prepare(
      `SELECT e.*, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) AS rsvp_count
       FROM events e WHERE e.id = ?`,
    )
    .bind(id)
    .first<EventRow>();
}

export async function userRsvp(eventId: string, userId: string | undefined) {
  if (!userId) return false;
  const row = await db()
    .prepare("SELECT 1 AS ok FROM rsvps WHERE event_id = ? AND user_id = ?")
    .bind(eventId, userId)
    .first<{ ok: number }>();
  return Boolean(row);
}

export async function myProposals(userId: string) {
  const rows = await db()
    .prepare("SELECT * FROM events WHERE proposed_by = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<EventRow>();
  return rows.results;
}

export async function savedHome(userId: string) {
  const row = await db()
    .prepare("SELECT session_id, payload, is_private, updated_at FROM homes WHERE user_id = ?")
    .bind(userId)
    .first<{ session_id: string; payload: string; is_private: number; updated_at: string }>();
  if (!row) return null;
  try {
    return { ...row, card: JSON.parse(row.payload) as HomeCard };
  } catch {
    return { ...row, card: null };
  }
}

export async function isFavorite(userId: string | undefined, type: string, id: string) {
  if (!userId) return false;
  const row = await db()
    .prepare("SELECT 1 AS ok FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?")
    .bind(userId, type, id)
    .first<{ ok: number }>();
  return Boolean(row);
}

export async function isClaimed(userId: string | undefined, resourceId: string) {
  if (!userId) return false;
  const row = await db()
    .prepare("SELECT 1 AS ok FROM claims WHERE user_id = ? AND resource_id = ?")
    .bind(userId, resourceId)
    .first<{ ok: number }>();
  return Boolean(row);
}

export async function gardenLists(userId: string) {
  const articles = await db()
    .prepare(
      `SELECT a.slug, a.title FROM favorites f
       JOIN articles a ON a.id = f.target_id
       WHERE f.user_id = ? AND f.target_type = 'article' ORDER BY f.created_at DESC`,
    )
    .bind(userId)
    .all<{ slug: string; title: string }>();
  const resources = await db()
    .prepare(
      `SELECT r.slug, r.title FROM claims c JOIN resources r ON r.id = c.resource_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC`,
    )
    .bind(userId)
    .all<{ slug: string; title: string }>();
  const posts = await db()
    .prepare("SELECT id, body, topic, created_at, status, review_note FROM posts WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<{ id: string; body: string; topic: string; created_at: string; status: string; review_note: string | null }>();
  return { articles: articles.results, resources: resources.results, posts: posts.results };
}

export async function adminSnapshot() {
  const reports = await db()
    .prepare(
      `SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at, u.display_name
       FROM reports r LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC LIMIT 40`,
    )
    .all<{
      id: string;
      target_type: string;
      target_id: string;
      reason: string;
      status: string;
      created_at: string;
      display_name: string | null;
    }>();
  const pending = await db()
    .prepare("SELECT * FROM events WHERE status = 'pending' ORDER BY created_at DESC")
    .all<EventRow>();
  const posts = await db()
    .prepare("SELECT id, author_name, body, topic, status, created_at FROM posts ORDER BY created_at DESC LIMIT 20")
    .all<{ id: string; author_name: string; body: string; topic: string; status: string; created_at: string }>();
  return { reports: reports.results, pending: pending.results, posts: posts.results };
}
