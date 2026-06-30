const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { UPLOAD_DIR } = require('../config');
const Attachment = require('../models/Attachment');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

function extFromMimetype(mime) {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    const { buffer, mimetype, originalname } = req.file;

    // Validate with sharp (will fail if not image)
    let meta;
    try {
      meta = await sharp(buffer).metadata();
    } catch (e) {
      return res.status(400).json({ error: 'invalid image' });
    }

    const doc = new Attachment({
      originalName: originalname,
      mimeType: mimetype,
      sizes: {
        original: { url: '', width: meta.width, height: meta.height, bytes: buffer.length, contentType: mimetype },
        medium: { url: '', width: undefined, height: undefined, bytes: undefined, contentType: 'image/jpeg' },
        thumb: { url: '', width: undefined, height: undefined, bytes: undefined, contentType: 'image/jpeg' },
      },
    });

    const id = doc._id.toString();
    const dir = path.join(UPLOAD_DIR, id);
    await ensureDir(dir);

    const origExt = extFromMimetype(mimetype);
    const originalFilename = `original.${origExt}`;
    const originalPath = path.join(dir, originalFilename);
    await fsp.writeFile(originalPath, buffer);

    // generate medium and thumb
    const mediumPipeline = sharp(buffer).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 80 });
    const mediumBuffer = await mediumPipeline.toBuffer();
    const mediumMeta = await sharp(mediumBuffer).metadata();
    const mediumFilename = 'medium.jpg';
    await fsp.writeFile(path.join(dir, mediumFilename), mediumBuffer);

    const thumbPipeline = sharp(buffer).resize({ width: 200, withoutEnlargement: true }).jpeg({ quality: 80 });
    const thumbBuffer = await thumbPipeline.toBuffer();
    const thumbMeta = await sharp(thumbBuffer).metadata();
    const thumbFilename = 'thumb.jpg';
    await fsp.writeFile(path.join(dir, thumbFilename), thumbBuffer);

    // set URLs
    doc.sizes.original.url = `/static/${id}/${originalFilename}`;
    doc.sizes.medium = {
      url: `/static/${id}/${mediumFilename}`,
      width: mediumMeta.width,
      height: mediumMeta.height,
      bytes: mediumBuffer.length,
      contentType: 'image/jpeg',
    };
    doc.sizes.thumb = {
      url: `/static/${id}/${thumbFilename}`,
      width: thumbMeta.width,
      height: thumbMeta.height,
      bytes: thumbBuffer.length,
      contentType: 'image/jpeg',
    };

    await doc.save();

    return res.status(201).json({
      id: id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sizes: doc.sizes,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
});

router.get('/', async (_req, res) => {
  const items = await Attachment.find().sort({ createdAt: -1 }).limit(50).lean();
  const mapped = items.map((d) => ({
    id: d._id.toString(),
    originalName: d.originalName,
    mimeType: d.mimeType,
    sizes: d.sizes,
    createdAt: d.createdAt,
  }));
  res.json(mapped);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });
  const d = await Attachment.findById(id).lean();
  if (!d) return res.status(404).json({ error: 'not found' });
  res.json({ id: d._id.toString(), originalName: d.originalName, mimeType: d.mimeType, sizes: d.sizes, createdAt: d.createdAt });
});

router.get('/:id/:size', async (req, res) => {
  const { id, size } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });
  if (!['original', 'medium', 'thumb'].includes(size)) return res.status(400).json({ error: 'invalid size' });
  const d = await Attachment.findById(id).lean();
  if (!d) return res.status(404).json({ error: 'not found' });
  const url = d.sizes[size] && d.sizes[size].url;
  if (!url) return res.status(404).json({ error: 'not found' });
  return res.redirect(302, url);
});

module.exports = router;
