const router = require('express').Router();
const { getUserDirectory } = require('../clients/directoryClient');

const INVALID_PAGINATION_RESPONSE = { error: 'Invalid pagination parameters' };

function parsePositiveInteger(value, defaultValue) {
  if (value === undefined) return defaultValue;
  if (!/^\d+$/.test(String(value))) return null;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;

  return parsed;
}

router.get('/users', async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1);
  const pageSize = parsePositiveInteger(req.query.page_size, 10);

  if (page === null || pageSize === null) {
    return res.status(400).json(INVALID_PAGINATION_RESPONSE);
  }

  try {
    const directory = await getUserDirectory({ page, page_size: pageSize });
    return res.json(directory);
  } catch (_err) {
    return res.status(502).json({ error: 'Unable to fetch user directory' });
  }
});

module.exports = router;
