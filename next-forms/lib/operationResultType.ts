type SuccessResult = {
  success: true;
};

type FailureResult = {
  success: false;
  error:
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'NO_PERMISSION'
    | 'LOGIN_REQUIRED'
    | 'USER_NOT_FOUND'
    | 'ALREADY_ANSWERED'
    | 'ACTION_FAILED';
};

export type OperationResult = SuccessResult | FailureResult;

export type OperationResultWithFormId =
  | ({ success: true; formId: string })
  | FailureResult;