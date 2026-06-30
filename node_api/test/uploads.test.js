const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

let app;
let mongoServer;
let tmpDir;

async function createPngBuffer() {
  const buf = await sharp({ create: { width: 40, height: 30, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .png()
    .toBuffer();
  return buf;
}

describe('uploads api', () => {
  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'uploads-test-'));
    process.env.UPLOAD_DIR = tmpDir;
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    // defer requiring app until after env is set
    app = require('../src/app');
    const { connect } = require('../src/db');
    await connect();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    try { await fsp.rm(tmpDir, { recursive: true, force: true }); } catch (e) {}
  });

  test('POST /uploads should accept image and return variants', async () => {
    const buf = await createPngBuffer();
    const res = await request(app)
      .post('/uploads')
      .attach('file', buf, { filename: 'test.png', contentType: 'image/png' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('sizes');
    expect(res.body.sizes).toHaveProperty('thumb');
    expect(res.body.sizes.thumb.url).toMatch(/^\/static\//);
    expect(res.body.sizes).toHaveProperty('medium');
    expect(res.body.sizes.medium.url).toMatch(/^\/static\//);

    // also verify files exist
    const id = res.body.id;
    const dir = path.join(tmpDir, id);
    const files = await fsp.readdir(dir);
    expect(files).toEqual(expect.arrayContaining(['original.png', 'medium.jpg', 'thumb.jpg']));
  });

  test('GET /uploads should list items', async () => {
    const res = await request(app).get('/uploads').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /uploads/:id should return metadata', async () => {
    const list = await request(app).get('/uploads').expect(200);
    const id = list.body[0].id;
    const res = await request(app).get(`/uploads/${id}`).expect(200);
    expect(res.body.id).toBe(id);
    expect(res.body.sizes.thumb.url).toMatch(/^\/static\//);
  });

  test('GET /uploads/:id/:size redirects and static serves file', async () => {
    const list = await request(app).get('/uploads').expect(200);
    const id = list.body[0].id;
    const redir = await request(app).get(`/uploads/${id}/thumb`).expect(302);
    const loc = redir.headers.location;
    expect(loc).toMatch(/^\/static\//);
    await request(app).get(loc).expect(200);
  });
});
