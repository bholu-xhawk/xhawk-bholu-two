const router = require('express').Router();
const Customer = require('../models/Customer');

const PAGE_SIZE = 20;
const MAX_PAGE = 500;
const DEFAULT_SORT = 'signedUpAt';
const DEFAULT_DIRECTION = 'desc';
const SORT_FIELDS = new Set(['name', 'email', 'company', 'status', 'signedUpAt']);
const REPEATED_QUERY_VALUE = Symbol('repeated query value');

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

function getSingleQueryValue(value) {
  if (Array.isArray(value)) return REPEATED_QUERY_VALUE;
  return value;
}

function rejectRepeatedQueryValue(query, field) {
  if (getSingleQueryValue(query[field]) === REPEATED_QUERY_VALUE) {
    return { error: `${field} must not be repeated` };
  }
  return null;
}

function positiveIntegerFromQuery(value) {
  const pageValue = getSingleQueryValue(value);
  if (pageValue === undefined) return 1;
  if (typeof pageValue !== 'string' || !/^[1-9]\d*$/.test(pageValue)) return null;
  return Number(pageValue);
}

function enumFromQuery(value, allowed, fallback) {
  const queryValue = getSingleQueryValue(value);
  if (queryValue === undefined || queryValue === '') return fallback;
  if (typeof queryValue !== 'string' || !allowed.has(queryValue)) return null;
  return queryValue;
}

function trimmedSearch(value) {
  const queryValue = getSingleQueryValue(value);
  if (queryValue === undefined) return '';
  if (typeof queryValue !== 'string') return '';
  return queryValue.trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateCustomerQuery(query) {
  for (const field of ['page', 'sort', 'direction', 'search']) {
    const repeatedError = rejectRepeatedQueryValue(query, field);
    if (repeatedError) return repeatedError;
  }

  const page = positiveIntegerFromQuery(query.page);
  if (page === null || !Number.isSafeInteger(page)) {
    return { error: 'page must be a positive integer' };
  }
  if (page > MAX_PAGE) {
    return { error: `page must be no greater than ${MAX_PAGE}` };
  }

  const sort = enumFromQuery(query.sort, SORT_FIELDS, DEFAULT_SORT);
  if (!sort) {
    return { error: 'sort must be one of name, email, company, status, signedUpAt' };
  }

  const direction = enumFromQuery(query.direction, new Set(['asc', 'desc']), DEFAULT_DIRECTION);
  if (!direction) {
    return { error: 'direction must be asc or desc' };
  }

  return {
    page,
    sort,
    direction,
    search: trimmedSearch(query.search),
  };
}

function buildFilter(search) {
  if (!search) return {};
  const escapedSearch = escapeRegExp(search.toLowerCase());
  const regex = new RegExp(`^${escapedSearch}`);
  return {
    $or: [{ nameSearch: regex }, { emailSearch: regex }],
  };
}

router.get('/', async (req, res) => {
  const validated = validateCustomerQuery(req.query || {});
  if (validated.error) return error(res, 400, validated.error);

  const { page, sort, direction, search } = validated;
  const filter = buildFilter(search);
  const sortDirection = direction === 'asc' ? 1 : -1;

  try {
    const [total, items] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter)
        .sort({ [sort]: sortDirection, _id: sortDirection })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    return res.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (_err) {
    return error(res, 500, 'internal error');
  }
});

module.exports = router;
