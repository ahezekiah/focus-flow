import type { PreSignUpTriggerHandler } from "aws-lambda";

/**
 * Registration is one step in Focus Flow: a customer gives their details and lands in
 * guided setup. Waiting on an emailed code would break that, so accounts registered
 * through the app are confirmed as they are created (see DR-04).
 */
export const handler: PreSignUpTriggerHandler = async event => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  return event;
};
