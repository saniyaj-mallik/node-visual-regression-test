const express = require('express');
const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch').default;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use('/outputs', express.static(path.join(__dirname, 'public/outputs')));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/compare', async (req, res) => {
  const { refUrl, testUrl, viewport } = req.body;
  if (!refUrl || !testUrl || !viewport || !viewport.width || !viewport.height) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const testId = uuidv4();
  const outputDir = path.join(__dirname, 'public/outputs', testId);
  await fs.ensureDir(outputDir);

  const refPath = path.join(outputDir, 'ref.png');
  const testPath = path.join(outputDir, 'test.png');
  const diffPath = path.join(outputDir, 'diff.png');

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: viewport.width, height: viewport.height });

    // Screenshot refUrl
    try {
      await page.goto(refUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.screenshot({ path: refPath });
    } catch (err) {
      return res.status(500).json({ error: `Failed to load refUrl: ${err.message}` });
    }

    // Screenshot testUrl
    try {
      await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.screenshot({ path: testPath });
    } catch (err) {
      return res.status(500).json({ error: `Failed to load testUrl: ${err.message}` });
    }

    // Read images
    let refImg, testImg;
    try {
      refImg = await sharp(refPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      testImg = await sharp(testPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    } catch (err) {
      return res.status(500).json({ error: `Failed to process images: ${err.message}` });
    }

    // Ensure same dimensions
    if (refImg.info.width !== testImg.info.width || refImg.info.height !== testImg.info.height) {
      return res.status(400).json({ error: 'Image dimensions do not match' });
    }

    let diffBuffer, diffPixels;
    try {
      diffBuffer = Buffer.alloc(refImg.info.width * refImg.info.height * 4);
      diffPixels = pixelmatch(
        refImg.data,
        testImg.data,
        diffBuffer,
        refImg.info.width,
        refImg.info.height,
        { threshold: 0.1 }
      );
      await sharp(diffBuffer, {
        raw: {
          width: refImg.info.width,
          height: refImg.info.height,
          channels: 4
        }
      }).png().toFile(diffPath);
    } catch (err) {
      return res.status(500).json({ error: `Failed to generate diff: ${err.message}` });
    }

    const totalPixels = refImg.info.width * refImg.info.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    res.json({
      diffPercentage: Number(diffPercentage.toFixed(2)),
      refImageUrl: `/outputs/${testId}/ref.png`,
      testImageUrl: `/outputs/${testId}/test.png`,
      diffImageUrl: `/outputs/${testId}/diff.png`
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: `Unexpected error: ${err.message}` });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
