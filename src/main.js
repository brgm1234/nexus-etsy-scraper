import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
await Actor.init();
const input = await Actor.getInput() ?? {};
const { keywords = ['handmade jewelry'], maxItems = 30, minPrice = 0, maxPrice = 0 } = input;
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['BUYPROXIES94952'] });
const crawler = new PlaywrightCrawler({
  proxyConfiguration, headless: true, navigationTimeoutSecs: 90,
  async requestHandler({ page, request }) {
    await page.waitForTimeout(3000);
    const products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-listing-id]')).map(el => ({
        title: el.querySelector('[class*="title"]')?.innerText?.trim() || el.querySelector('h3')?.innerText?.trim(),
        price: el.querySelector('[class*="currency-value"]')?.innerText?.trim(),
        rating: el.querySelector('[class*="rating"]')?.innerText?.trim(),
        reviews: el.querySelector('[class*="count"]')?.innerText?.trim(),
        imageUrl: el.querySelector('img')?.src,
        productUrl: el.querySelector('a')?.href,
        seller: el.querySelector('[class*="shop-name"]')?.innerText?.trim(),
        isBestseller: !!el.querySelector('[class*="bestseller"]'),
        freeShipping: el.innerText.toLowerCase().includes('free shipping'),
      })).filter(p => p.title);
    });
    console.log('Found ' + products.length + ' products for: ' + request.userData.keyword);
    await Actor.pushData(products.slice(0, request.userData.maxItems));
  },
});
const requests = keywords.map(keyword => {
  let url = 'https://www.etsy.com/search?q=' + encodeURIComponent(keyword);
  if (minPrice > 0) url += '&min=' + minPrice;
  if (maxPrice > 0) url += '&max=' + maxPrice;
  return { url, userData: { keyword, maxItems } };
});
await crawler.run(requests);
await Actor.exit();