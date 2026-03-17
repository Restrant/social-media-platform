const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

// ── GET /api/users/:username  (public profile) ───────────────
router.get('/:username', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.created_at,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following_count,
              (SELECT COUNT(*) FROM posts    WHERE user_id     = u.id) AS posts_count,
              EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following
       FROM users u WHERE u.username = ?`,
      [req.user.id, req.params.username]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/users/me  (update profile) ──────────────────────
router.put('/me', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { full_name, bio, avatar_url } = req.body;
  try {
    await db.query(
      'UPDATE users SET full_name = ?, bio = ?, avatar_url = ? WHERE id = ?',
      [full_name, bio, avatar_url, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/users/:username/posts ───────────────────────────
router.get('/:username/posts', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [user] = await db.query('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!user.length) return res.status(404).json({ message: 'User not found' });

    const [posts] = await db.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
              (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [req.user.id, user[0].id]
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/users/:username/followers ───────────────────────
router.get('/:username/followers', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [user] = await db.query('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!user.length) return res.status(404).json({ message: 'User not found' });

    const [followers] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url,
              EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following
       FROM follows f JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?`,
      [req.user.id, user[0].id]
    );
    res.json(followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
