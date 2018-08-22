const { question } = require('paths');
const BasePage = require('test/page-objects/base');

class QuestionPage extends BasePage {
  constructor(page, hearingId, questionId) {
    super(page);
    this.page = page;
    this.pagePath = `${question}/${hearingId}/${questionId}`;
  }

  async saveAnswer(answer) {
    await this.enterTextintoField('#question-field', answer);
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickElement('#save-answer')
    ]);
  }
}

module.exports = QuestionPage;