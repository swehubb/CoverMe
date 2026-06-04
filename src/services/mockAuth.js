import mockUser from '../data/mockUser';

export function login() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        token: `mock-jwt-token-${Date.now()}`,
        user: { ...mockUser },
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
