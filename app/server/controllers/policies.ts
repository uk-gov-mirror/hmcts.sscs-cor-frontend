import { Router, Request, Response } from 'express';
import * as Paths from '../paths';

function getCookiePrivacy(req: Request, res: Response) {
  res.render('policy-pages/cookie-privacy.html', {
    ft_welsh: req.session.featureToggles.ft_welsh
  });
}

function setupCookiePrivacyController(): Router {
  const router = Router();
  router.get(Paths.cookiePrivacy, getCookiePrivacy);
  return router;
}

export {
    setupCookiePrivacyController,
    getCookiePrivacy
};
