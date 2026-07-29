// Base HTTP adapter. Every REST client in clients/ goes through this factory -
// it owns base-URL resolution, auth-header injection and standard tagging.
// The `name` tag defaults to the path template so per-endpoint metrics don't
// explode in cardinality when IDs appear in URLs (pass tags.name to override).

import http from 'k6/http';

export function createHttpClient({ baseUrl, tokenProvider = null, defaultTags = {} }) {
  function buildParams(path, body, params) {
    const headers = Object.assign({}, params.headers);
    if (body !== null && body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (tokenProvider) {
      headers['Authorization'] = `Bearer ${tokenProvider()}`;
    }
    const tags = Object.assign({ name: path }, defaultTags, params.tags);
    return Object.assign({}, params, { headers, tags });
  }

  function serialize(body) {
    return body === null || body === undefined || typeof body === 'string'
      ? body ?? null
      : JSON.stringify(body);
  }

  function request(method, path, body = null, params = {}) {
    return http.request(method, `${baseUrl}${path}`, serialize(body), buildParams(path, body, params));
  }

  // N identical requests fired through http.batch (parallelism: k6's
  // batchPerHost, default 20). Used by the limits profile to trip rate
  // windows deterministically. Returns the array of responses.
  function burst(method, path, body, n, params = {}) {
    const req = [method, `${baseUrl}${path}`, serialize(body), buildParams(path, body, params)];
    return http.batch(Array(n).fill(req));
  }

  return {
    get: (path, params) => request('GET', path, null, params),
    post: (path, body, params) => request('POST', path, body, params),
    patch: (path, body, params) => request('PATCH', path, body, params),
    del: (path, params) => request('DELETE', path, null, params),
    request,
    burst,
  };
}
