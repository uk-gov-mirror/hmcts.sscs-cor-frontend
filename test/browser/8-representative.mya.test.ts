import { Page } from 'puppeteer';
const { expect } = require('test/chai-sinon');
import { startServices } from 'test/browser/common';
import { LoginPage } from 'test/page-objects/login';
import { AssignCasePage } from 'test/page-objects/assign-case';
import { StatusPage } from 'test/page-objects/status';
import * as _ from 'lodash';
const content = require('locale/content');
const config = require('config');
const pa11y = require('pa11y');
const pa11yScreenshotPath = config.get('pa11yScreenshotPath');
let pa11yOpts = _.clone(config.get('pa11y'));

describe('Representative - Manage your appeal app @mya', () => {
  let ccdCase;
  let page: Page;
  let loginPage: LoginPage;
  let assignCasePage: AssignCasePage;
  let statusPage: StatusPage;
  let sidamUser;
  before(async () => {
    ({ ccdCase, page, sidamUser = {} } = await startServices({ bootstrapData: true, hearingType: 'oral' }));
    const representativeTya = ccdCase.hasOwnProperty('representative_tya') ? ccdCase.representative_tya : 'anId';
    pa11yOpts.browser = page.browser;
    loginPage = new LoginPage(page);
    assignCasePage = new AssignCasePage(page);
    statusPage = new StatusPage(page);
    await loginPage.setCookie('manageYourAppeal', 'true');
    await loginPage.visitPage(`?tya=${representativeTya}`);
    await loginPage.login(sidamUser.email || 'oral.appealReceived@example.com', sidamUser.password || '');
  });

  after(async () => {
    if (page && page.close) {
      await page.close();
    }
  });

  it('Representative should land in assign-case page after a successful login', async() => {
    assignCasePage.verifyPage();
  });

    /* PA11Y */
  it('Representative checks /postcode page path passes @pa11y', async () => {
    assignCasePage.verifyPage();
    pa11yOpts.screenCapture = `${pa11yScreenshotPath}/postcode-page.png`;
    pa11yOpts.page = assignCasePage.page;
    const result = await pa11y(pa11yOpts);
    expect(result.issues.length).to.equal(0, JSON.stringify(result.issues, null, 2));
  });

  it('Representative should inform postcode, submit and land in status page', async() => {
    await assignCasePage.fillPostcode('TN32 6PL');
    await assignCasePage.submit();

    statusPage.verifyPage();
  });

  /* PA11Y */
  it('Representative checks /status page path passes @pa11y', async () => {
    statusPage.verifyPage();
    pa11yOpts.screenCapture = `${pa11yScreenshotPath}/status-page.png`;
    pa11yOpts.page = await statusPage.page;
    const result = await pa11y(pa11yOpts);
    expect(result.issues.length).to.equal(0, JSON.stringify(result.issues, null, 2));
  });

  describe('Representative Status page', () => {
    it('should display navigation tabs and Status tab should be active', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.navigation-tabs')).to.not.be.null;
      expect(await statusPage.getElementText('.navigation-tabs ul li.selected')).contain(content.en.statusTab.tabHeader);
    });

    it('should display subheading', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.task-list h2')).to.equal(content.en.statusTab.header);
    });

    it('should display status bar', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.task-list h2')).to.equal(content.en.statusTab.header);
    });

    it('should display panel with latest update', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.panel')).contain(content.en.statusTab.panelHeader);
    });

    it('should display Help and Support links', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.mya-contact__content h2')).to.equal(content.en.helpGuides.header);
      expect(await statusPage.getElementText('.mya-contact__content .govuk-list')).contain(content.en.helpGuides.representatives.linkHeader);
      expect(await statusPage.getElementText('.mya-contact__content .govuk-list')).contain(content.en.helpGuides.withdrawAppeal.linkHeader);
    });

    it('should display Contact us for help options and open details', async() => {
      statusPage.verifyPage();
      expect(await statusPage.getElementText('.govuk-details.contact-us')).to.equal(content.en.contactUs.title);
      const elementHandle = await page.$('.govuk-details.contact-us');
      const heightClosed = await page.evaluate(element => {
        const { height } = element.getBoundingClientRect();
        return height;
      }, elementHandle);

      expect(heightClosed).to.equal(40);
    });

    it('should open Contact us details', async() => {
      statusPage.verifyPage();
      const elementHandle = await page.$('.govuk-details.contact-us');
      await statusPage.openDetails('.govuk-details.contact-us');
      const heightOpen = await page.evaluate(element => {
        const { height } = element.getBoundingClientRect();
        return height;
      }, elementHandle);

      expect(heightOpen).to.equal(610);
    });
  });
});
