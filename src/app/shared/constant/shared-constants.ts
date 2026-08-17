export const API_URLS = {
  AUTH: {
    LOGIN: '/Auth/login',
    REGISTER: '/Auth/register'
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