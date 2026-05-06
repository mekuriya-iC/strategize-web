import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup to ensure dev server is ready before tests run
 * This is especially important for Next.js with Turbopack which compiles on-demand
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001';
  
  console.log('🔍 Waiting for dev server to be ready...');
  
  // Launch a browser to trigger Next.js page compilation
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Try to load the auth page to trigger compilation
    // This ensures the page is compiled before tests run
    await page.goto(`${baseURL}/auth`, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait for the page to actually render
    await page.waitForSelector('input#email', { timeout: 30000 });
    
    console.log('✅ Dev server is ready and auth page is compiled');
  } catch (error) {
    console.error('❌ Failed to verify dev server readiness:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
