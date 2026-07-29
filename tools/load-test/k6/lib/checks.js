// Reusable assertion helpers. Check names double as documentation in the
// summary output, so keep them short and stable — dashboards group by them.

import { check } from 'k6';

// expectStatus(res, 200, 'chat providers') / expectStatus(res, [200, 202], …)
export function expectStatus(res, expected, label) {
  const statuses = Array.isArray(expected) ? expected : [expected];
  return check(res, {
    [`${label}: status ${statuses.join('/')}`]: (r) => statuses.includes(r.status),
  });
}

// Body parses as JSON and satisfies the predicate (default: any JSON).
export function expectJson(res, label, predicate) {
  return check(res, {
    [`${label}: valid JSON`]: (r) => {
      try {
        const body = r.json();
        return predicate ? predicate(body) : body !== undefined;
      } catch (_) {
        return false;
      }
    },
  });
}
