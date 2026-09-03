export const API_URLS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  }
};

export const USER_ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  USER: 'user'
} as const;

export const LOAN_STATUS = {
  ACTIVE: 'Active',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue'
} as const;
