export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;

  const code = error?.code || error?.message;

  // Firebase Auth errors
  if (code === 'auth/email-already-in-use') return 'This email is already registered';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters';
  if (code === 'auth/invalid-email') return 'Invalid email format';
  if (code === 'auth/user-not-found') return 'User not found';
  if (code === 'auth/wrong-password') return 'Incorrect password';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later';

  // Firestore errors
  if (code === 'permission-denied') return "You don't have permission to do that";
  if (code === 'not-found') return 'Item not found';
  if (code === 'already-exists') return 'Item already exists';
  if (code === 'invalid-argument') return 'Invalid input';
  if (code === 'failed-precondition') return 'Operation not allowed at this time';

  // Network errors
  if (code === 'NETWORK_ERROR' || code === 'ERR_NETWORK') return 'Network error. Check your connection';
  if (code === 'TIMEOUT') return 'Request timed out';

  return error?.message || 'Something went wrong. Please try again';
};

export const logError = (context: string, error: any) => {
  console.error(`[${context}]`, error);
};
