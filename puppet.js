const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');
const cliProgress = require('cli-progress');
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

function getType(tokenId) {
  let type;
  switch (tokenId) {
    case 1: // Gold Pass
      type = 'Gold';
      break;
    case 2: // Silver Pass
      type = 'Silver';
      break;
    default:
      // The one of one mistakes, etc...
      type = 'Other';
  }
  return type;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const tId = [];
  const owner = [];
  const amount = [];
  console.log('GETTING ALL PASS HOLDERS THIS MAY TAKE A FEW MOMENTS');
  const url =
    'https://etherscan.io/token/generic-tokenholder-inventory?m=normal&contractAddress=0x0bd4d37e0907c9f564aaa0a7528837b81b25c605&a=&p=';
  await page.goto(url + '1', { waitUntil: 'domcontentloaded' });
  const inithtml = await page.content();
  const init = cheerio.load(inithtml);
  const totalTokens = init('p:first').text().trim();
  const pageText = init('.text-nowrap:first').text().trim();
  const totalPages = parseInt(pageText.substring(pageText.indexOf('f') + 2));
  progressBar.start(totalPages, 0);
  for (let i = 1; i < totalPages + 1; i++) {
    progressBar.update(i);
    await page.goto(url + i, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);
    let looped = 0;
    $('#resulttable > table > tbody > tr > td').map((index, element) => {
      switch (looped) {
        case 0:
          tId.push(parseInt($(element).text()));
          break;
        case 1:
          owner.push($(element).text());
          break;
        case 2:
          amount.push(parseInt($(element).text()));
      }
      looped++;
      if (looped === 3) {
        looped = 0;
      }
    });
  }
  progressBar.stop();
  console.log(totalTokens);
  console.log(
    'Addresses Below will be less than tokens found as duplicates are removed so the address is only found once throught each list',
  );
  console.log('-----------------------------');
  const addresses = [];
  for (const i in tId) {
    addresses.push({ token_id: tId[i], owner: owner[i], amount: amount[i] });
  }

  const combinedPassHolder = './public/files/CombinedPassHolders.csv';
  const goldPassHolder = './public/files/GoldPassHolders.csv';
  const silverPassHolder = './public/files/SilverPassHolders.csv';

  let passType;
  const seen = {};
  const gPass = [];
  const sPass = [];
  addresses.map((pass, idx) => {
    passType = getType(pass.token_id);
    if (pass.owner === '0xe8d939f1a9cc4e85e09aff3d60d137a1bea17b21') {
      // Don't add since its llama's address and he would have to remove himself anyways so one less step
    } else {
      if (seen[pass.owner] === undefined) {
        if (passType === 'Gold') {
          gPass.push({ ownerAddress: pass.owner });
          seen[pass.owner] = 'Found';
        }
        if (passType === 'Silver') {
          sPass.push({ ownerAddress: pass.owner });
          seen[pass.owner] = 'Found';
        }
        // Ignore the mistaken passes until llama decides how or if they will be used
      }
    }
  });
  console.log(`${gPass.length} gold addresses exported to : ${goldPassHolder}`);
  new ObjectsToCsv(gPass).toDisk(goldPassHolder);
  console.log(`${sPass.length} silver addresses exported to: ${silverPassHolder}`);
  new ObjectsToCsv(sPass).toDisk(silverPassHolder);
  const combined = gPass.concat(sPass);
  const cPass = new Set(combined);
  console.log(`${[...cPass].length} addresses exported to: ${combinedPassHolder}`);
  console.log(
    'Amounts should be 1 less than etherscans amount since llamas address is removed from the list!',
  );
  new ObjectsToCsv([...cPass]).toDisk(combinedPassHolder);

  await browser.close();
})();
