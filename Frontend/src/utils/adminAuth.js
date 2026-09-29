// Shared helper for admin API authentication.
// Backend admin routes (inventory, product/bundle creation) require a Bearer token;
// these helpers attach the admin token stored by AdminAuthContext.

export const getAdminToken = () => localStorage.getItem('adminToken');

export const getAdminAuthHeaders = () => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Attach an interceptor to an axios instance so every admin request carries the token.
export const attachAdminAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return axiosInstance;
};
