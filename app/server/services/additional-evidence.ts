import { Request } from 'express';
import { RequestPromise } from './request-wrapper';

export interface EvidenceDescriptor {
  created_date: string;
  file_name: string;
  id: string;
}

export class AdditionalEvidenceService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async saveStatement(onlineHearingId: string, statementText: string, req: Request) {
    return RequestPromise.request({
      method: 'POST',
      uri: `${this.apiUrl}/continuous-online-hearings/${onlineHearingId}/statement`,
      body: {
        body: statementText
      }
    }, req);
  }

  async uploadEvidence(hearingId: string, file: Express.Multer.File, req: Request): Promise<EvidenceDescriptor> {
    return RequestPromise.request({
      method: 'PUT',
      uri: `${this.apiUrl}/continuous-online-hearings/${hearingId}/evidence`,
      simple: false,
      resolveWithFullResponse: true,
      formData: {
        file: {
          value: file.buffer,
          options: {
            filename: file.originalname,
            contentType: file.mimetype
          }
        }
      }
    }, req);
  }

  async removeEvidence(hearingId: string, evidenceId: string, req: Request) {
    return RequestPromise.request({
      method: 'DELETE',
      uri: `${this.apiUrl}/continuous-online-hearings/${hearingId}/evidence/${evidenceId}`,
      headers: {
        'Content-Length': '0'
      }
    }, req);
  }

  async getEvidences(hearingId: string, req: Request): Promise<EvidenceDescriptor[]> {
    return RequestPromise.request({
      method: 'GET',
      uri: `${this.apiUrl}/continuous-online-hearings/${hearingId}/evidence`
    }, req);
  }

  async getCoversheet(caseId: string, req: Request) {
    return RequestPromise.request({
      method: 'GET',
      encoding: 'binary',
      uri: `${this.apiUrl}/continuous-online-hearings/${caseId}/evidence/coversheet`,
      headers: {
        'Content-type': 'applcation/pdf'
      }
    }, req);
  }

  async submitEvidences(hearingId: string, description: string, req: Request) {
    return RequestPromise.request({
      method: 'POST',
      uri: `${this.apiUrl}/continuous-online-hearings/${hearingId}/evidence`,
      body: {
        body: description
      },
      headers: {
        'Content-Length': '0'
      }
    }, req);
  }
}
