import { getDemoAccount, getDemoAccountByUid } from '../data/mockAccounts';

export function login(accountIdOrUid) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const account = getDemoAccountByUid(accountIdOrUid) || getDemoAccount(accountIdOrUid);
      resolve({
        success: true,
        token: `mock-jwt-token-${Date.now()}`,
        user: { ...account },
      });
    }, 800);
  });
}

export function logout() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 300);
  });
}

export default { login, logout };
