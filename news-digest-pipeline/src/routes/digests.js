import { Router } from 'express';
import {
  getDigest,
  getDigests,
  getNewArticles,
  getArticlesByDigestId,
} from '../db/index.js';
import { generateDigest } from '../services/digest-generator.js';
import { publishDigest } from '../services/publishers/index.js';
import { getDb } from '../db/index.js';
import config from '../config.js';

const router = Router();

// POST /api/digests/generate — manual trigger
router.post('/generate', async (req, res) => {
  try {
    const { articleIds } = req.body || {};

    let articles;
    if (Array.isArray(articleIds) && articleIds.length > 0) {
      const db = getDb();
      const placeholders = articleIds.map(() => '?').join(',');
      articles = db.prepare(
        `SELECT * FROM articles WHERE id IN (${placeholders})`
      ).all(...articleIds);
    } else {
      articles = getNewArticles(config.maxArticlesPerDigest);
    }

    if (articles.length === 0) {
      return res.status(400).json({ error: 'No articles available for digest generation' });
    }

    const db = getDb();
    const digestId = await generateDigest(db, articles, config);

    res.status(201).json({ digestId });
  } catch (err) {
    console.error('[digests] POST /generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/digests — list digests
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const digests = getDigests(filters);
    res.json(digests);
  } catch (err) {
    console.error('[digests] GET / error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/digests/:id — single digest with articles
router.get('/:id', (req, res) => {
  try {
    const digest = getDigest(req.params.id);
    if (!digest) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    const articles = getArticlesByDigestId(digest.id);

    res.json({ ...digest, articles });
  } catch (err) {
    console.error('[digests] GET /:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/digests/:id/publish — publish to enabled platforms
router.post('/:id/publish', async (req, res) => {
  try {
    const digest = getDigest(req.params.id);
    if (!digest) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    if (!digest.content) {
      return res.status(400).json({ error: 'Digest has no content to publish' });
    }

    const results = await publishDigest(digest, config);
    res.json({ digestId: digest.id, published: results });
  } catch (err) {
    console.error('[digests] POST /:id/publish error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
