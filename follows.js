const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

// ── POST /api/follows/:userId  (toggle follow) ───────────────
router.post('/:userId', auth, async (req, res) => {
  const db = req.app.locals.db;
  const targetId = parseInt(req.params.userId);

  if (targetId === req.user.id)
    return res.status(400).json({ message: "You can't follow yourself" });

  try {
    const [existing] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, targetId]
    );
    if (existing.length) {
      await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, targetId]);
      res.json({ following: false });
    } else {
      await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, targetId]);
      res.json({ following: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/follows/suggestions  (who to follow) ────────────
router.get('/suggestions', auth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
       FROM users u
       WHERE u.id != ?
         AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
       ORDER BY followers_count DESC LIMIT 5`,
      [req.user.id, req.user.id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
