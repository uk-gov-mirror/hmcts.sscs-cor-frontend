const { question } = require('app/server/paths');
import { BasePage } from 'test/page-objects/base';

export class QuestionPage extends BasePage {
  constructor(page, questionOrdinal) {
    super(page);
    this.pagePath = `${question}/${questionOrdinal}`;
  }

  async answer(answer, submit) {
    await this.enterTextintoField('#question-field', answer);
    const buttonId = submit ? '#submit-answer' : '#save-answer';
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickElement(buttonId)
    ]);
  }

  async saveAnswer(answer) {
    await this.answer(answer, false);
  }

  async submitAnswer(answer) {
    await this.answer(answer, true);
  }
}
