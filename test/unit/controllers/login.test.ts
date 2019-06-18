import { IdamService } from 'app/server/services/idam';
const { expect, sinon } = require('test/chai-sinon');
import { getLogout, getIdamCallback, setupLoginController, redirectToLogin, redirectToIdam } from 'app/server/controllers/login.ts';
import * as AppInsights from 'app/server/app-insights';
import * as express from 'express';
import * as Paths from 'app/server/paths';
import { HearingService } from 'app/server/services/hearing';
const config = require('config');
const i18n = require('locale/en');

const idamUrl = config.get('idam.url');

describe('controllers/login', () => {
  let next;
  let req;
  let res;
  const hearingDetails = {
    online_hearing_id: '1',
    case_reference: 'SC/123/456',
    appellant_name: 'John Smith'
  };

  beforeEach(() => {
    req = {
      session: {
        question: {},
        destroy: sinon.stub().yields()
      },
      body: {
        'email-address': 'test@example.com'
      },
      protocol: 'http',
      hostname: 'localhost',
      query: { redirectUrl : '', tya: 'tya-number' }
    };
    res = {
      render: sinon.stub(),
      redirect: sinon.stub()
    };
    next = sinon.stub();
    sinon.stub(AppInsights, 'trackException');
  });

  afterEach(() => {
    (AppInsights.trackException as sinon.SinonStub).restore();
  });

  describe('#redirectToLogin', () => {
    it('redirect to login page', () => {
      redirectToLogin(req, res);
      expect(res.redirect).to.have.been.calledOnce.calledWith('/sign-in');
    });
  });

  describe('#getLogout', () => {
    it('destroys the session and redirects to login', async () => {
      req.session.accessToken = 'accessToken';
      const idamServiceStub = {
        deleteToken: sinon.stub().withArgs(req.session.accessToken).resolves({})
      } as IdamService;

      await getLogout(idamServiceStub)(req, res);
      expect(idamServiceStub.deleteToken).to.have.been.calledOnce.calledWith(req.session.accessToken);
      expect(req.session.destroy).to.have.been.calledOnce.calledWith();
      expect(res.redirect).to.have.been.calledOnce.calledWith(Paths.login);
    });

  });

  describe('#getLogout with redirectUrl Parameter', () => {
    it('destroys the session and redirects to custom url with redirectUrl parameter.', async () => {
      req.session.accessToken = 'accessToken';
      req.query.redirectUrl = Paths.taskList;
      const idamServiceStub = {
        deleteToken: sinon.stub().withArgs(req.session.accessToken).resolves({})
      } as IdamService;

      await getLogout(idamServiceStub)(req, res);
      expect(idamServiceStub.deleteToken).to.have.been.calledOnce.calledWith(req.session.accessToken);
      expect(req.session.destroy).to.have.been.calledOnce.calledWith();
      expect(res.redirect).to.have.been.calledOnce.calledWith(Paths.taskList);
    });
  });

  describe('#redirectToIdam', () => {
    it('builds correct url', () => {

      const idamServiceStub = {
        getRedirectUrl: sinon.stub().withArgs('http', 'localhost').returns('http://redirect_url')
      } as IdamService;
      redirectToIdam('/idam_path', idamServiceStub)(req, res);

      expect(res.redirect).to.have.been.calledOnce.calledWith(idamUrl + '/idam_path?redirect_uri=http%3A%2F%2Fredirect_url&client_id=sscs_cor&response_type=code&state=tya-number');
    });

    it('builds correct sign in url', () => {

      const idamServiceStub = {
        getRedirectUrl: sinon.stub().withArgs('http', 'localhost').returns('http://redirect_url')
      } as IdamService;
      req.query = { redirectUrl : '', state: 'state-value' };

      redirectToIdam('/idam_path', idamServiceStub)(req, res);

      expect(res.redirect).to.have.been.calledOnce.calledWith(idamUrl + '/idam_path?redirect_uri=http%3A%2F%2Fredirect_url&client_id=sscs_cor&response_type=code&state=state-value');
    });
  });

  describe('#getIdamCallback', () => {
    describe('called without code', () => {
      it('redirects to idam login', async () => {
        req.query = {};

        const redirectToIdam = sinon.stub();
        await getIdamCallback(redirectToIdam, null, null, null)(req, res, next);

        expect(redirectToIdam).to.have.been.calledOnce.calledWith(req, res);
      });
    });

    const accessToken = 'someAccessToken';
    describe('on success', () => {
      let hearingServiceStub;
      beforeEach(async () => {
        req.query = { 'code': 'someCode', 'state': 'tya-number' };
        const redirectToIdam = sinon.stub();
        const idamServiceStub = {
          getToken: sinon.stub().withArgs('someCode', 'http', 'localhost').resolves({ 'access_token': accessToken }),
          getUserDetails: sinon.stub().withArgs(accessToken).resolves({ 'email': 'someEmail@example.com' })
        } as IdamService;
        hearingServiceStub = {
          getOnlineHearing: sinon.stub().resolves({ statusCode: 200, body: hearingDetails })
        } as HearingService;

        await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);
        expect(req.session.accessToken).to.be.eql(accessToken);
        expect(req.session.tya).to.be.eql('tya-number');
      });

      it('calls the online hearing service', () => {
        expect(hearingServiceStub.getOnlineHearing).to.have.been.calledOnce.calledWith('someEmail@example.com', req);
      });

      it('redirects to task list page', () => {
        expect(res.redirect).to.have.been.calledWith(Paths.taskList);
      });
    });

    describe('on success with case id', () => {
      const accessToken = 'someAccessToken';
      let hearingServiceStub;
      beforeEach(async () => {
        req.query = {
          'code': 'someCode',
          'caseId': 'someCaseId'
        };
        const redirectToIdam = sinon.stub();
        const idamServiceStub = {
          getToken: sinon.stub().withArgs('someCode', 'http', 'localhost').resolves({ 'access_token': accessToken }),
          getUserDetails: sinon.stub().withArgs(accessToken).resolves({ 'email': 'someEmail@example.com' })
        } as IdamService;
        hearingServiceStub = {
          getOnlineHearing: sinon.stub().resolves({ statusCode: 200, body: hearingDetails })
        } as HearingService;

        await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);
        expect(req.session.accessToken).to.be.eql(accessToken);
      });

      it('calls the online hearing service', () => {
        expect(hearingServiceStub.getOnlineHearing).to.have.been.calledOnce.calledWith('someEmail@example.com+someCaseId', req);
      });

      it('redirects to task list page', () => {
        expect(res.redirect).to.have.been.calledWith(Paths.taskList);
      });
    });

    describe('on load case failure', () => {
      let hearingServiceStub;
      const registerUrl = 'someUrl';
      let idamServiceStub;
      let redirectToIdam;

      beforeEach(async () => {
        req.query = { 'code': 'someCode' };
        redirectToIdam = sinon.stub();
        let accessToken = 'someAccessToken';

        idamServiceStub = {
          getToken: sinon.stub().withArgs('someCode', 'http', 'localhost').resolves({ 'access_token': accessToken }),
          getUserDetails: sinon.stub().withArgs(accessToken).resolves({ 'email': 'someEmail@example.com' }),
          getRegisterUrl: sinon.stub().withArgs('http', 'localhost').returns(registerUrl)
        } as IdamService;
      });

      it('loads error page when cannot find appeal', async () => {
        hearingServiceStub = {
          getOnlineHearing: sinon.stub().resolves({ statusCode: 404 })
        } as HearingService;

        await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);

        expect(res.render).to.have.been.calledWith('load-case-error.html', {
          errorBody: '<p>Either you have changed your email address or you do not have an active benefit appeal.</p><p>If you have changed your email address then you need to create a new account using your new email address:</p>',
          errorHeader: 'There is no benefit appeal associated with this email address',
          registerUrl
        });
      });

      it('loads error page when multiple appeals found', async () => {
        hearingServiceStub = {
          getOnlineHearing: sinon.stub().resolves({ statusCode: 422 })
        } as HearingService;

        await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);

        expect(res.render).to.have.been.calledWith('load-case-error.html', {
          errorBody: i18n.login.failed.technicalError.body,
          errorHeader: i18n.login.failed.technicalError.header
        });
      });

      it('loads error page when appeal found but it is not cor', async () => {
        hearingServiceStub = {
          getOnlineHearing: sinon.stub().resolves({ statusCode: 409 })
        } as HearingService;

        await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);

        expect(res.render).to.have.been.calledWith('load-case-error.html', {
          errorBody: '<p>Please check any emails or letters you have received about your benefit appeal if you would like an update.</p>',
          errorHeader: 'You cannot access this service'
        });
      });
    });
  });

  describe('on error', () => {
    const error = new Error('getOnlineHearingService error');

    beforeEach(async () => {
      req.query = { 'code': 'someCode' };
      const redirectToIdam = sinon.stub();
      let accessToken = 'someAccessToken';
      const idamServiceStub = {
        getToken: sinon.stub().withArgs('someCode', 'http', 'localhost').resolves({ 'access_token': accessToken }),
        getUserDetails: sinon.stub().withArgs(accessToken).resolves({ 'email': 'someEmail@example.com' })
      } as IdamService;
      const hearingServiceStub = {
        getOnlineHearing: sinon.stub().rejects(error)
      } as HearingService;

      await getIdamCallback(redirectToIdam, idamServiceStub, hearingServiceStub, null)(req, res, next);
    });

    it('tracks the exception', () => {
      expect(AppInsights.trackException).to.have.been.calledOnce.calledWith(error);
    });
    it('calls next with the error', () => {
      expect(next).to.have.been.calledWith(error);
    });
  });
});

describe('#setupLoginController', () => {
  const deps = {};

  beforeEach(() => {
    sinon.stub(express, 'Router').returns({
      get: sinon.stub(),
      post: sinon.stub()
    });
  });

  afterEach(() => {
    (express.Router as sinon.SinonStub).restore();
  });

  it('sets up GET login', () => {
    setupLoginController(deps);
    expect(express.Router().get).to.have.been.calledWith(Paths.login);
  });

  it('sets up GET logout', () => {
    setupLoginController(deps);
    expect(express.Router().get).to.have.been.calledWith(Paths.logout);
  });

  it('sets up GET register', () => {
    setupLoginController(deps);
    expect(express.Router().get).to.have.been.calledWith(Paths.register);
  });

  it('returns the router', () => {
    const controller = setupLoginController(deps);
    expect(controller).to.equal(express.Router());
  });
});
