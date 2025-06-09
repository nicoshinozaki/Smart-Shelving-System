// Api.js
import { useContext } from 'react';
import { CsrfContext } from './CrsfContext';

export function useApi() {
  const { csrfToken, refreshCsrf } = useContext(CsrfContext);

  /**
   * apiFetch behaves exactly like fetch, but:
   * 1) ensures credentials: 'include'
   * 2) always re-fetches CSRF just before you POST/PUT/DELETE
   * 3) injects X-CSRF-Token header
   */
  const apiFetch = async (url, options = {}) => {
    const { method = 'GET', headers = {}, ...rest } = options;

    let tokenToUse = csrfToken;
    // if this is a mutating request, get a fresh token
    if (['POST','PUT','PATCH','DELETE'].includes(method.toUpperCase())) {
      tokenToUse = await refreshCsrf();
    }

    return fetch(url, {
      method,
      credentials: 'include',
      headers: {
        ...headers,
        'Content-Type': headers['Content-Type'] || 'application/json',
        'X-CSRF-Token': tokenToUse
      },
      ...rest
    });
  };

  return { apiFetch };
}
