import { Logger } from '@hmcts/nodejs-logging';

const multer = require('multer');
const i18next = require('i18next');
import { NextFunction, Request, Response } from 'express';
import * as config from 'config';
import * as path from 'path';
const fs = require('fs');
const content = require('../../../locale/content');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { Readable } = require('stream');
const logger = Logger.getLogger('login.js');

const maxFileSizeInMb: number = config.get('evidenceUpload.maxFileSizeInMb');

function handleFileUploadErrors(err: any, req: Request, res: Response, next: NextFunction) {
  logger.info('handleFileUploadErrors');
  let error: string;
  if (err instanceof multer.MulterError) {
    logger.info(`MulterError ${err}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = `${content[i18next.language].questionUploadEvidence.error.tooLarge} ${maxFileSizeInMb}MB.`;
    } else if (err.code === 'LIMIT_FILE_TYPE') {
      error = content[i18next.language].questionUploadEvidence.error.invalidFileType;
    } else {
      error = content[i18next.language].questionUploadEvidence.error.fileCannotBeUploaded;
    }
    res.locals.multerError = error;
    return next();
  }
  return next(err);
}

function validateFileSize(req: Request, res: Response, next: NextFunction) {
  if (req.file) {
    let error: string;
    const fileExtension = path.extname(req.file.originalname);
    if ('text/plain' === req.file.mimetype && '.txt' === fileExtension.toLocaleLowerCase()) {
      logger.info(`Setting file size error for ${fileExtension.toLocaleLowerCase()} and ${req.file.mimetype} and ${req.file.size}`);
      error = `${content[i18next.language].questionUploadEvidence.error.tooLarge} ${req.file.size}MB.`;
      res.locals.multerError = error;
      req.file = null;
      return next();
    }

    if ('.mp3' === fileExtension.toLocaleLowerCase() || '.flac' === fileExtension.toLocaleLowerCase()) {
      const stream = Readable.from(req.file.buffer);
      getAudioDurationInSeconds(stream).then((duration) => {
        logger.info(`Audio length is ${duration}`);
      });
    }
  }
  return next();
}

export {
    handleFileUploadErrors,
    validateFileSize
};
