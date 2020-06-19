import { Router, Request, Response } from 'express';
import * as Paths from '../paths';
import { isFeatureEnabled, Feature } from '../utils/featureEnabled';

function getHearing(req: Request, res: Response) {
  if (!isFeatureEnabled(Feature.MANAGE_YOUR_APPEAL, req.cookies) || req.session.appeal.hearingType === 'cor') return res.render('errors/404.html', {
    ft_welsh: req.session.featureToggles.ft_welsh
  });
  const { latestEvents = [], historicalEvents = [], hearingType } = req.session.appeal;
  const attending: boolean = hearingType === 'oral';
  const hearingInfo = latestEvents.concat(historicalEvents).find(event => {
    const { type } = event;
    if (type === 'HEARING_BOOKED' || type === 'NEW_HEARING_BOOKED') return event;
  });

  let hearingArrangements = {};

  if (req.session.hearing && req.session.hearing.hearing_arrangements) {
    hearingArrangements = req.session.hearing.hearing_arrangements;
  }
  return res.render('hearing-tab.html', {
    hearingInfo,
    attending,
    hearingArrangements,
    ft_welsh: req.session.featureToggles.ft_welsh
  });
}

function setupHearingController(deps: any) {
  const router = Router();
  router.get(Paths.hearing, deps.prereqMiddleware, getHearing);
  return router;
}

export {
  getHearing,
  setupHearingController
};
