export const isUserLoggedIn = () => {
  return !!localStorage.getItem('token');
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const logoutAdmin = () => {
  localStorage.removeItem('adminToken');
};