const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('response', response => {
    if(!response.ok() && response.url().includes('/api/')) {
        console.log('API_ERROR:', response.status(), response.url());
    }
  });

  await page.goto('http://localhost:5175/login');
  await page.waitForSelector('input[type="email"]');
  
  await page.type('input[type="email"]', 'admin@volunteerhub.org');
  await page.type('input[type="password"]', 'Admin@1234');
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  
  console.log('FINAL_URL:', page.url());
  
  await browser.close();
})();
