const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

// ── GET /api/posts/feed  (posts from followed users + own) ───
router.get('/feed', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [posts] = await db.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
              (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
          OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
       ORDER BY p.created_at DESC LIMIT 50`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/posts/explore  (all posts) ──────────────────────
router.get('/explore', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [posts] = await db.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
              (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/posts  (create post) ───────────────────────────
router.post('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { content, image_url } = req.body;
  if (!content) return res.status(400).json({ message: 'Content is required' });

  try {
    const [result] = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.id, content, image_url || null]
    );
    const [post] = await db.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
              0 AS likes_count, 0 AS comments_count, 0 AS liked_by_me
       FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(post[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /api/posts/:id ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Post not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/posts/:id/like  (toggle like) ──────────────────
router.post('/:id/like', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length) {
      await db.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/posts/:id/comments ──────────────────────────────
router.get('/:id/comments', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [comments] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/posts/:id/comments ─────────────────────────────
router.post('/:id/comments', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Comment content required' });

  try {
    const [result] = await db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]
    );
    const [comment] = await db.query(
      'SELECT c.*, u.username, u.full_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [result.insertId]
    );
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /api/posts/:id/comments/:cid ──────────────────────
router.delete('/:id/comments/:cid', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT user_id FROM comments WHERE id = ?', [req.params.cid]);
    if (!rows.length) return res.status(404).json({ message: 'Comment not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Not allowed' });
    await db.query('DELETE FROM comments WHERE id = ?', [req.params.cid]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
