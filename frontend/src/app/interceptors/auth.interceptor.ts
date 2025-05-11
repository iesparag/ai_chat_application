import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  // Start with base headers
  let headers = req.headers
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json');
  
  // Add Authorization header if token exists
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const cloned = req.clone({
    headers,
    withCredentials: true // Enable credentials for CORS
  });
  
  return next(cloned);
};
