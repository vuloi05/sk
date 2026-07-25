const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('Navigating to http://localhost:3000/#');
  await page.goto('http://localhost:3000/#');
  
  console.log('Setting localStorage to skip auth...');
  await page.goto('http://localhost:3000/#');
  await page.evaluate(() => {
    localStorage.setItem('dictaflow_user', JSON.stringify({
      id: 'test',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test' }
    }));
  });
  await page.goto('http://localhost:3000/#');

  await page.waitForSelector('#nav-vocab-en', { timeout: 5000 });
  console.log('Clicking "Học Tiếng Anh (SRS)"...');
  await page.click('#nav-vocab-en');
  
  // Wait a bit to let the crash happen
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  console.log('Done.');
})();
