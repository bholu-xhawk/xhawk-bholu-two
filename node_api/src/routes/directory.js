const router = require('express').Router();
const { fetchUserDirectory } = require('../clients/directoryClient');

router.get('/users', async (req, res) => {
  try {
    const directory = await fetchUserDirectory({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    return res.json(directory);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'failed to fetch user directory' });
  }
});

module.exports = router;
