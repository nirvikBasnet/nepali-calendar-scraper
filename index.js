const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const SAVE_FILE_FOR_EACH_YEAR = true;
const START_YEAR = 2081;
const END_YEAR = 2081;

const getHost = (year, month) =>
  `https://www.hamropatro.com/calendar/${year}/${month}/`;
const scrapHamroPatro = async (page, year, month) => {
  const host = getHost(year, month);
  console.log(`Fetching ${host}`);
  await page.goto(host);
  const days = await page.evaluate(() => {
    const tableOfNepEngNums = new Map([
      ['०', 0],
      ['१', 1],
      ['२', 2],
      ['३', 3],
      ['४', 4],
      ['५', 5],
      ['६', 6],
      ['७', 7],
      ['८', 8],
      ['९', 9],
    ]);

    const monthMap = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    function nepToEngNum(strNum) {
      return String(strNum).replace(/[०-९]/g, (digit) =>
        tableOfNepEngNums.get(digit),
      );
    }

    function monthToNum(month) {
      return monthMap[month];
    }

    return Array.from(
      document.querySelectorAll('.calendar .dates li:not(.disable)'),
    ).map((item) => {
      const enDate = (item.querySelector('div.col2') || {}).innerText || '';
      const [monthName, day, year] = enDate.match(/[^\s\n,]+/g);

      const fullDate = (item.querySelector('div.col1') || {}).innerText || '';
      const dateFull = fullDate.match(/[^\n]+/g).join('');
      const dayInNep = dateFull.split(',')[1].replace(/\s/g, '');
      var isWeekend = false;
      if (dayInNep === 'शनिवार') {
        isWeekend = true;
      }

      return {
        isHoliday: item.classList.contains('holiday'),
        tithi: (item.querySelector('span.tithi') || {}).innerText || '',
        event: (item.querySelector('span.event') || {}).innerText || '',
        day: (item.querySelector('span.nep') || {}).innerText || '',
        fullDate: dateFull,
        dayInNep: dayInNep,
        isWeekend: isWeekend,
        dayInEn:
          parseInt(
            nepToEngNum((item.querySelector('span.nep') || {}).innerText),
          ) || '',
        // Convert month name to its numerical representation
        dayInAd: (item.querySelector('span.eng') || {}).innerText || '',
        monthInAd: monthToNum(monthName),
        yearInAd: year,
      };
    });
  });

  return { year, month, days };
};

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    const data = {};
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      data[year] = [];
      for (let month = 1; month <= 1; month++) {
        const result = await scrapHamroPatro(page, year, month);

        data[year].push(result);
      }
      if (SAVE_FILE_FOR_EACH_YEAR) {
        await fs.writeFile(
          `data/years/${year}.json`,
          JSON.stringify(data[year]),
        );
      }
    }
    if (!SAVE_FILE_FOR_EACH_YEAR) {
      await fs.writeFile('data/data.json', JSON.stringify(data));
    }
    console.log('Finished...');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
