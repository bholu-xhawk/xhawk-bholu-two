const router = require('express').Router({ mergeParams: true });

function buildMockPost(userId, postId, overrides = {}) {
  return {
    userId,
    postId,
    title: overrides.title || 'Mock post title',
    body: overrides.body || 'Mock post body',
  };
}

router.post('/', (req, res) => {
  const { userId } = req.params;
  const { title, body } = req.body || {};
  const post = buildMockPost(userId, 'mock-post-1', { title, body });

  return res.status(201).json(post);
});

router.get('/', (req, res) => {
  const { userId } = req.params;

  return res.json([
    buildMockPost(userId, 'mock-post-1'),
    buildMockPost(userId, 'mock-post-2', {
      title: 'Another mock post',
      body: 'More mock post content',
    }),
  ]);
});

router.get('/:postId', (req, res) => {
  const { userId, postId } = req.params;

  return res.json(buildMockPost(userId, postId));
});

router.put('/:postId', (req, res) => {
  const { userId, postId } = req.params;
  const { title, body } = req.body || {};

  return res.json(buildMockPost(userId, postId, { title, body }));
});

router.delete('/:postId', (_req, res) => {
  return res.status(204).send();
});

module.exports = router;
