import * as path from 'path';
import * as fs from 'fs';
const { expect, sinon } = require('test/chai-sinon');
const config = require('config');
import { AdditionalEvidenceService } from 'app/server/services/additional-evidence';
import { RequestPromise } from 'app/server/services/request-wrapper';

describe('services/additional-evidence', () => {
  let rpStub: sinon.SinonStub;
  let sandbox: sinon.SinonSandbox = sinon.sandbox.create();
  const req: any = {};
  const apiUrl = config.get('api.url');
  const additionalEvidenceService = new AdditionalEvidenceService(apiUrl);
  req.session = {
    accessToken : 'someUserToken',
    serviceToken : 'someServiceToken',
    tya: 'wqiuvokQlD',
    idamEmail: 'appellant@email.com'
  };
  const hearingId: string = 'hearingId';
  const evidenceId: string = 'evidenceId';
  const file: Partial<Express.Multer.File> = {
    fieldname: 'file-upload-1',
    originalname: 'some_evidence.txt',
    mimetype: 'text/plain',
    buffer: fs.readFileSync(path.join(__dirname, '/../../fixtures/evidence/evidence.txt'))
  };

  beforeEach(() => {
    rpStub = sandbox.stub(RequestPromise, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should save Statement', async () => {
    const expectedRequestOptions = {
      body: {
        body: 'text',
        tya: 'wqiuvokQlD'
      },
      method: 'POST',
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/statement`
    };

    await additionalEvidenceService.saveStatement(hearingId, 'text', req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });

  it('should uploadEvidence', async () => {
    const expectedRequestOptions = {
      formData: {
        file: {
          value: file.buffer,
          options: {
            filename: file.originalname,
            contentType: file.mimetype
          }
        }
      },
      simple: false,
      resolveWithFullResponse: true,
      method: 'PUT',
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/evidence`
    };

    await additionalEvidenceService.uploadEvidence(hearingId, file as Express.Multer.File, req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });

  it('should removeEvidence', async () => {
    const expectedRequestOptions = {
      method: 'DELETE',
      headers: { 'Content-Length': '0' },
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/evidence/${evidenceId}`
    };

    await additionalEvidenceService.removeEvidence(hearingId, evidenceId, req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });

  it('should getEvidences', async () => {
    const expectedRequestOptions = {
      method: 'GET',
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/evidence`
    };

    await additionalEvidenceService.getEvidences(hearingId, req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });

  it('should getCoversheet', async () => {
    const expectedRequestOptions = {
      method: 'GET',
      encoding: 'binary',
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/evidence/coversheet`,
      headers: {
        'Content-type': 'application/pdf'
      }
    };

    await additionalEvidenceService.getCoversheet(hearingId, req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });

  it('should submitEvidences', async () => {
    const description: string = 'An evidence description';
    const expectedRequestOptions = {
      method: 'POST',
      body: {
        body: description,
        idamEmail: 'appellant@email.com'
      },
      headers: {
        'Content-type': 'application/json'
      },
      uri: `${apiUrl}/api/continuous-online-hearings/${hearingId}/evidence`
    };

    await additionalEvidenceService.submitEvidences(hearingId, description, req);
    expect(rpStub).to.have.been.calledOnce.calledWith(expectedRequestOptions);
  });
});
