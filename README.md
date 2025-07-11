# Puppeteer-Based Visual Regression Testing Tool

This tool provides an API for visual regression testing using Puppeteer, pixelmatch, and Express.

## Features
- Compare screenshots of two URLs
- Get a diff image and mismatch percentage
- All images are saved in unique folders for each test

## How to Use

1. **Start the server:**

   ```sh
   node server.js
   ```

   The server will run at `http://localhost:3000` by default.

2. **API Endpoint:**
   - **POST** `/api/compare`
   - **Content-Type:** `application/json`

3. **Request Payload Example:**

   ```json
   {
     "refUrl": "https://saniyajmallik.vercel.app/",
     "testUrl": "https://saniyajmallik.vercel.app/",
     "viewport": {
       "width": 1280,
       "height": 800
     }
   }
   ```

4. **Response Example:**

   ```json
   {
     "diffPercentage": 0.1,
     "refImageUrl": "/outputs/92e7c85a-be31-40fa-adb1-a7cbe524423b/ref.png",
     "testImageUrl": "/outputs/92e7c85a-be31-40fa-adb1-a7cbe524423b/test.png",
     "diffImageUrl": "/outputs/92e7c85a-be31-40fa-adb1-a7cbe524423b/diff.png"
   }
   ```

- The image URLs are accessible via the server (e.g., `http://localhost:3000/outputs/...`).

## Usage
You can also use the included web UI at `http://localhost:3000` to run comparisons and view results visually.