import puppeteer from 'puppeteer';
import {performance} from 'perf_hooks';
import {CaptureScreenShotOptions} from './types/CaptureScreenshotOptions';
import {timeDelta} from './time-delta';
import {renderScreenshot} from './render-screenshot';

export async function captureScreenshot(options: CaptureScreenShotOptions) {
  const browserT0 = performance.now();
  const {
    inputUrls,
    outputPaths,
    backgroundColors,
    modelViewerArgs,
    modelViewerUrl,
    width,
    height,
    debug,
    quality,
    devicePixelRatio,
    formatExtension,
  } = options;
  const headless = !debug;
  const args = [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-zygote',
    '--enable-webgl',
    '--ignore-gpu-blacklist',
    // '--use-gl=egl', // Use OpenGL ES through EGL
      // '--enable-webgl2-compute-context', // Enable WebGL2 Compute Context if needed
      // '--disable-web-security', // Disable web security for CORS, if your use case requires it
      // '--disable-setuid-sandbox',
      // '--enable-accelerated-2d-canvas', // Accelerate 2D canvas
      // '--disable-gpu-rasterization', // Force software rasterization
      // '--enable-gpu-rasterization', // Force GPU rasterization
  ];

  if (headless) {
    args.push('--single-process');
  } else {
    args.push('--start-maximized');
  }

  const browser = await puppeteer.launch({
    args,
    defaultViewport: {
      width,
      height,
      deviceScaleFactor: devicePixelRatio,
    },
    headless,
  });

  const browserT1 = performance.now();
  let captureTime = 0;

  console.log(`🚀  Launched browser (${timeDelta(browserT0, browserT1)}s)`);

  const page = await browser.newPage();

  page.on('error', (error) => {
    console.log(`🚨  Page Error: ${error}`);
  });

  page.on('console', async (message) => {
    const args = await Promise.all(
      message.args().map((arg) => arg.jsonValue()),
    );

    if (args.length) {
      console.log(`➡️`, ...args);
    }
  });

  for (let i = 0; i < inputUrls.length; i++) {
    try {
      await renderScreenshot({
        inputPath: inputUrls[i],
        outputPath: outputPaths[i],
        backgroundColor: backgroundColors[i],
        modelViewerArgs: modelViewerArgs[i],
        quality,
        formatExtension,
        modelViewerUrl,
        page,
        options,
      });

      captureTime = performance.now();
    } catch (error) {
      console.log('❌  Closing browser because of error');

      browser.close();
    }
  }

  browser.close();
  console.log(
    `🪂  Closed browser (${timeDelta(captureTime, performance.now())}s)`,
  );
}
