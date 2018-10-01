const coh = require('test/fixtures/coh')
const ccd = require('test/fixtures/ccd')

async function waitForQuestionRoundIssued(hearingId, roundNum, attemptNum) {
  const MAX_ATTEMPTS = 30
  const DELAY_BETWEEN_ATTEMPTS_MS = 1000
  const currentAttemptNum = attemptNum || 1
  if (currentAttemptNum > MAX_ATTEMPTS) {
    return Promise.reject(new Error(`Question round not issued after ${MAX_ATTEMPTS} attempts`))
  }
  const questionRound = await coh.getQuestionRound(hearingId, roundNum)
  const questionRoundState = questionRound.question_round_state.state_name
  if (questionRoundState !== 'question_issued') {
    console.log(`Question round not issued at attempt ${currentAttemptNum}: ${questionRoundState}`)
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_ATTEMPTS_MS))
    const nextAttemptNum = currentAttemptNum + 1
    return await waitForQuestionRoundIssued(hearingId, roundNum, nextAttemptNum)
  }
  console.log(`Question round issued successfully at attempt ${currentAttemptNum}`)
  return Promise.resolve(questionRound)
}

async function waitForDecisionIssued(hearingId, attemptNum) {
  const MAX_ATTEMPTS = 30
  const DELAY_BETWEEN_ATTEMPTS_MS = 1000
  const currentAttemptNum = attemptNum || 1
  if (currentAttemptNum > MAX_ATTEMPTS) {
    return Promise.reject(new Error(`Decision not issued after ${MAX_ATTEMPTS} attempts`))
  }
  const decision = await coh.getDecision(hearingId)
  const decisionState = decision.decision_state.state_name
  if (decisionState !== 'decision_issued') {
    console.log(`Decision not issued at attempt ${currentAttemptNum}: ${decisionState}`)
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_ATTEMPTS_MS))
    const nextAttemptNum = currentAttemptNum + 1
    return await waitForDecisionIssued(hearingId, nextAttemptNum)
  }
  console.log(`Decision issued successfully at attempt ${currentAttemptNum}`)
  return Promise.resolve(decision)
}

/* eslint-disable-next-line consistent-return */
async function bootstrapCoh(ccdCase) {
  try {
    const hearingId = await coh.createOnlineHearing(ccdCase.caseId);
    const questionList = await coh.createQuestions(hearingId);
    const questionIdList = questionList.map(q => q.question_id);
    const questionId = questionIdList[0];
    await coh.setQuestionRoundToIssued(hearingId);
    const questionRound = await waitForQuestionRoundIssued(hearingId, 1, null);
    const firstQuestion = questionRound.question_references.filter(q => q.question_id === questionId).pop();
    const questionHeader = firstQuestion.question_header_text;
    const questionBody = firstQuestion.question_body_text;
    const deadlineExpiryDate = firstQuestion.deadline_expiry_date;
    return { hearingId, questionIdList, questionId, questionHeader, questionBody, deadlineExpiryDate };
  } catch (error) {
    console.log('Error bootstrapping COH with test data', error)
    return Promise.reject(error)
  }
}

async function bootstrapCcdCase() {
  try {
    const ccdCase = await ccd.createCase()
    return ccdCase
  } catch (error) {
    console.log('Error bootstrapping CCD with test case', error)
    return Promise.reject(error)
  }
}

export async function bootstrap() {
  try {
    const ccdCase = await bootstrapCcdCase()
    const cohTestData = await bootstrapCoh(ccdCase)
    return { ccdCase, cohTestData }
  } catch (error) {
    return Promise.reject(error)
  }
}

export async function createAndIssueDecision(hearingId) {
  try {
    await coh.createDecision(hearingId);
    await coh.issueDecision(hearingId);
    await waitForDecisionIssued(hearingId, 1);
  } catch (error) {
    return Promise.reject(error)
  }
}