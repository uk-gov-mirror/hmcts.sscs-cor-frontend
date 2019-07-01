import { getIndex, postIndex } from 'app/server/controllers/assign-case';
import { expect, sinon } from '../../chai-sinon';
import { OK } from 'http-status-codes';
import { HearingService } from '../../../app/server/services/hearing';

describe('controllers/assign-case.js', () => {
  let sandbox: sinon.SinonSandbox;
  let req;
  let res;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    res = {
      render: sandbox.spy(),
      redirect: sandbox.spy()
    } as any;
  });

  describe('getIndex', () => {
    it('should render assign-case page', () => {
      req = {
        query: {}
      } as any;

      getIndex(req, res);
      expect(res.render).to.have.been.calledOnce.calledWith('assign-case/index.html', {});
    });

    it('should render assign-case page with error', () => {
      const error = 'true';
      req = {
        query: {
          error
        }
      } as any;

      getIndex(req, res);
      expect(res.render).to.have.been.calledOnce.calledWith('assign-case/index.html', { error });
    });
  });

  describe('postIndex', () => {
    const idamEmail = 'someEmail@example.com';
    const tya = 'some-tya-number';
    const postcode = 'somePostcode';
    let onlineHearing;
    let hearingService: HearingService;
    let underTest;

    beforeEach(() => {
      req = {
        session: { idamEmail, tya },
        body: { postcode }
      } as any;

      onlineHearing = {
        hearingId: 'hearingId'
      };

      hearingService = {
        assignOnlineHearingsToCitizen: sandbox.stub().resolves({
          statusCode: OK,
          body: onlineHearing
        })
      } as any;

      underTest = postIndex(hearingService);
    });

    it('assigns user to case', async () => {
      await underTest(req, res);

      expect(hearingService.assignOnlineHearingsToCitizen).to.have.been.calledOnce.calledWith(idamEmail, tya, postcode, req);
    });

    it('redirects to task-list', async () => {
      await underTest(req, res);

      expect(res.redirect).to.have.been.calledOnce.calledWith('/task-list');
    });

    it('sets hearing in session', async () => {
      await underTest(req, res);

      expect(req.session.hearing).to.be.eql(onlineHearing);
    });
  });
});