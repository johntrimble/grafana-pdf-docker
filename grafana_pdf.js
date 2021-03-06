'use strict';

/*
 * Source taken from:
 * 
 * https://github.com/kartik468/grafana-generate-pdf-nodejs/blob/main/grafana_pdf.js
 * https://gist.github.com/svet-b/1ad0656cd3ce0e1a633e16eb20f66425
 */

const puppeteer = require('puppeteer');
const { program } = require('commander');

program
  .option('-u, --user <user>', 'Grafana username')
  .option('-p, --password <password>', 'Grafana password')
  .option('-t, --api-token <api-token>', 'Grafana API token')
  .option('-o, --output <pdf>', 'Output PDF')
  .option('--hide-sidemenu', 'Hides the page sidemenu')
  .argument('[url]', 'Dashboard URL');

program.parse(process.argv);

const opts = program.opts();

// Build the auth header either from environment variables or CLI options,
// giving preference to CLI.

function basicAuthHeaderValue(user, pass) {
  return 'Basic ' + new Buffer.from(`${user}:${pass}`).toString('base64');
}

let auth_header;

if (process.env.GF_API_TOKEN) {
  auth_header = 'Bearer ' + process.env.GF_API_TOKEN;
} else if (process.env.GF_USERNAME) {
  auth_header = basicAuthHeaderValue(process.env.GF_USERNAME, process.env.GF_PASSWORD);
}

if (opts.apiToken) {
  auth_header = 'Bearer ' + process.env.GF_API_TOKEN;
} else if (opts.user) {
  auth_header = basicAuthHeaderValue(opts.user, opts.password);
}

const dashboard_url = program.args.length > 0 ? program.args[0] : process.env.GF_URL;
const output_pdf = opts.output || process.env.GF_OUTPUT;
const hide_sidemenu = opts.hideSidemenu;

// Set the browser width in pixels. The paper size will be calculated on the basus of 96dpi,
// so 1200 corresponds to 12.5".
const width_px = 1200;
// Note that to get an actual paper size, e.g. Letter, you will want to *not* simply set the pixel
// size here, since that would lead to a "mobile-sized" screen (816px), and mess up the rendering.
// Instead, set e.g. double the size here (1632px), and call page.pdf() with format: 'Letter' and
// scale = 0.5.

(async () => {
  try {

    const browser = await puppeteer.launch({
      headless: true,
      // for docker few folks had issues. so added below line
      args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox"
        ],
    });
    
    const page = await browser.newPage();

    // Set auth headers
    if (auth_header) {
      await page.setExtraHTTPHeaders({ 'Authorization': auth_header });
    }

    // Increase timeout from the default of 30 seconds to 120 seconds, to allow for slow-loading panels
    page.setDefaultNavigationTimeout(120000);

    // Increasing the deviceScaleFactor gets a higher-resolution image. The width should be set to
    // the same value as in page.pdf() below. The height is not important
    await page.setViewport({
      width: width_px,
      height: 800,
      deviceScaleFactor: 2,
      isMobile: false
    })

    // Wait until all network connections are closed (and none are opened withing 0.5s).
    // In some cases it may be appropriate to change this to {waitUntil: 'networkidle2'},
    // which stops when there are only 2 or fewer connections remaining.
    await page.goto(dashboard_url, { waitUntil: 'networkidle0' });

    // Hide all panel description (top-left "i") pop-up handles and, all panel resize handles
    // Annoyingly, it seems you can't concatenate the two object collections into one
    await page.evaluate(() => {
      let infoCorners = document.getElementsByClassName('panel-info-corner');
      for (el of infoCorners) { el.hidden = true; };
      let resizeHandles = document.getElementsByClassName('react-resizable-handle');
      for (el of resizeHandles) { el.hidden = true; };
    });

    if (hide_sidemenu) {
      await page.evaluate(() => {
        let el = document.querySelector('sidemenu');
        if (el) {
          el.hidden = true;
        }
      });
    }

    // Get the height of the main canvas, and add a margin
    var height_px = await page.evaluate(() => {
      return document.getElementsByClassName('react-grid-layout')[0].getBoundingClientRect().bottom;
    }) + 20;

    // == auto scroll to the bottom to solve long grafana dashboard start
    async function autoScroll(page) {
      await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var height_px = document.getElementsByClassName('react-grid-layout')[0].getBoundingClientRect().bottom;
          var timer = setInterval(() => {
            var scrollHeight = height_px;

            // select the scrollable view
            // in newer version of grafana the scrollable div is 'scrollbar-view'
            var scrollableEl = document.querySelector('.view') || document.querySelector('.scrollbar-view');
            // element.scrollBy(0, distance);
            scrollableEl.scrollBy({
              top: distance,
              left: 0,
              behavior: 'smooth'
            });

            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 300);
        });
      });
    }

    await autoScroll(page);
    // == auto scroll to the bottom to solve long grafana dashboard end

    let pdf_opts = {
      width: width_px + 'px',
      height: height_px + 'px',
      //    format: 'Letter', <-- see note above for generating "paper-sized" outputs
      scale: 1,
      displayHeaderFooter: false,
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };

    if (output_pdf) {
      pdf_opts.path = output_pdf
    }

    await page.pdf(pdf_opts);
    await browser.close();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
