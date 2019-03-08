import { HearingService } from 'app/server/services/hearing';
import * as moment from 'moment';
const { expect } = require('test/chai-sinon');
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_ENTITY, NO_CONTENT } = require('http-status-codes');
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
      const userToken = 'someUserToken';
      const serviceToken = 'someServiceToken';
      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .get(path)
          .query({ email })
          .reply(OK, apiResponseBody);
      });

      it('resolves the promise', () => (
        expect(hearingService.getOnlineHearing(email, userToken, serviceToken)).to.be.fulfilled
      ));

      it('resolves the promise with the response', async () => {
        const response = await hearingService.getOnlineHearing(email, userToken);
        expect(response.body).to.deep.equal(apiResponseBody);
      });
    });

    describe('error response', () => {
      const error = { value: INTERNAL_SERVER_ERROR, reason: 'Server Error' };
      const userToken = 'someUserToken';
      const serviceToken = 'someServiceToken';

      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .get(path)
          .query({ email })
          .replyWithError(error);
      });

      it('rejects the promise with the error', () => (
        expect(hearingService.getOnlineHearing(email, userToken, serviceToken)).to.be.rejectedWith(error)
      ));
    });

    describe('hearing not found', () => {
      const userToken = 'someUserToken';
      const serviceToken = 'someServiceToken';
      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .get(path)
          .query({ email })
          .reply(NOT_FOUND);
      });

      it('resolves the promise with 404 status', async () => {
        const response = await hearingService.getOnlineHearing(email, userToken, serviceToken);
        expect(response.statusCode).to.equal(NOT_FOUND);
      });
    });

    describe('multiple hearings found', () => {
      const userToken = 'someUserToken';
      const serviceToken = 'someServiceToken';
      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .get(path)
          .query({ email })
          .reply(UNPROCESSABLE_ENTITY);
      });

      it('resolves the promise with 422 status', async () => {
        const response = await hearingService.getOnlineHearing(email, userToken, serviceToken);
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

    const userToken = 'someUserToken';
    const serviceToken = 'someServiceToken';

    describe('Update hearing deadline', () => {
      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .patch(path)
          .reply(OK, apiResponse);
      });
      it('resolves the promise with the response', async () => (
        expect(hearingService.extendDeadline(hearingId, userToken, serviceToken)).to.eventually.eql(apiResponse)
      ));
    });

    describe('rejecting the promises', () => {
      const error = { value: INTERNAL_SERVER_ERROR, reason: 'Server Error' };

      const userToken = 'someUserToken';
      const serviceToken = 'someServiceToken';
      before(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .get(path)
          .replyWithError(error);
      });

      after(() => {
        nock.cleanAll();
      });

      it('rejects updateDeadline with the error', () => (
        expect(hearingService.extendDeadline(hearingId, userToken, serviceToken)).to.be.rejectedWith(error)
      ));
    });
  });

  describe('#recordTribunalViewResponse', () => {
    const hearingId = '121';
    const path = `/continuous-online-hearings/${hearingId}/tribunal-view`;

    const userToken = 'someUserToken';
    const serviceToken = 'someServiceToken';
    describe('on success', () => {
      beforeEach(() => {
        nock(apiUrl, {
          Authorization: `Bearer ${userToken}`,
          ServiceAuthorization: `Bearer ${serviceToken}`
        })
          .patch(path)
          .reply(NO_CONTENT);
      });
      it('resolves the promise', async () => (
        expect(hearingService.recordTribunalViewResponse(hearingId, 'decision_accepted', userToken, serviceToken)).to.eventually.be.fulfilled
      ));
    });
    describe('on failure', () => {
      const error = { value: INTERNAL_SERVER_ERROR, reason: 'Server Error' };
      beforeEach(() => {
        nock(apiUrl)
          .get(path)
          .replyWithError(error);
      });
      it('rejects updateDeadline with the error', () => (
        expect(hearingService.recordTribunalViewResponse(hearingId, 'decision_accepted', userToken, serviceToken)).to.be.rejectedWith(error)
      ));
    });
  });
});
