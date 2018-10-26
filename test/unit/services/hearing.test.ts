import { HearingService } from 'app/server/services/hearing';
import * as moment from 'moment';
const { expect } = require('test/chai-sinon');
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_ENTITY } = require('http-status-codes');
const nock = require('nock');
const config = require('config');

const apiUrl = config.get('api.url');

describe('services/hearing', () => {
  const email = 'test@example.com';
  const path = '/continuous-online-hearings';
  let hearingService;

  before(() => {
    hearingService = new HearingService(apiUrl);
  });

  describe('#getOnlineHearing', () => {
    const apiResponseBody = {
      appellant_name: 'Adam Jenkins',
      case_reference: 'SC/112/233',
      online_hearing_id: 'abc-123-def-456'
    };

    describe('success response', () => {
      beforeEach(() => {
        nock(apiUrl)
          .get(path)
          .query({ email })
          .reply(OK, apiResponseBody);
      });

      it('resolves the promise', () => (
        expect(hearingService.getOnlineHearing(email)).to.be.fulfilled
      ));

      it('resolves the promise with the response', async() => {
        const response = await hearingService.getOnlineHearing(email);
        expect(response.body).to.deep.equal(apiResponseBody);
      });
    });

    describe('error response', () => {
      const error = { value: INTERNAL_SERVER_ERROR, reason: 'Server Error' };

      beforeEach(() => {
        nock(apiUrl)
          .get(path)
          .query({ email })
          .replyWithError(error);
      });

      it('rejects the promise with the error', () => (
        expect(hearingService.getOnlineHearing(email)).to.be.rejectedWith(error)
      ));
    });

    describe('hearing not found', () => {
      beforeEach(() => {
        nock(apiUrl)
          .get(path)
          .query({ email })
          .reply(NOT_FOUND);
      });

      it('resolves the promise with 404 status', async() => {
        const response = await hearingService.getOnlineHearing(email);
        expect(response.statusCode).to.equal(NOT_FOUND);
      });
    });

    describe('multiple hearings found', () => {
      beforeEach(() => {
        nock(apiUrl)
          .get(path)
          .query({ email })
          .reply(UNPROCESSABLE_ENTITY);
      });

      it('resolves the promise with 422 status', async() => {
        const response = await hearingService.getOnlineHearing(email);
        expect(response.statusCode).to.equal(UNPROCESSABLE_ENTITY);
      });
    });
  });

  describe('#extendDeadline', () => {
    const hearingId = '121';
    const path = `/continuous-online-hearings/${hearingId}`;
    const apiResponse = {
      deadline_expiry_date: moment.utc().add(14, 'day').format()
    };

    describe('Update hearing deadline', () => {
      beforeEach(() => {
        nock(apiUrl)
          .patch(path)
          .reply(OK, apiResponse);
      });
      it('resolves the promise with the response', async () => (
        expect(hearingService.extendDeadline(hearingId)).to.eventually.eql(apiResponse)
      ));
    });

    describe('rejecting the promises', () => {
      const error = { value: INTERNAL_SERVER_ERROR, reason: 'Server Error' };

      before(() => {
        nock(apiUrl)
          .get(path)
          .replyWithError(error);
      });

      after(() => {
        nock.cleanAll();
      });

      it('rejects updateDeadline with the error', () => (
        expect(hearingService.extendDeadline(hearingId)).to.be.rejectedWith(error)
      ));
    });
  });
});
