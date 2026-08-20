const mongoose = require('mongoose');
const Group = require('../models/Group');

function sameId(a, b) {
  return a && b && a.toString() === b.toString();
}

function requireGroupMember(options = {}) {
  const { roles } = options;
  return async (req, res, next) => {
    const groupId = req.params.groupId;
    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ error: 'invalid group id' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });
    const membership = group.members.find((member) => sameId(member.user, req.user._id));
    if (!membership) return res.status(403).json({ error: 'group access denied' });
    if (roles && !roles.includes(membership.role)) return res.status(403).json({ error: 'insufficient group role' });
    req.group = group;
    req.membership = membership;
    return next();
  };
}

module.exports = { requireGroupMember };
