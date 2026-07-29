// Authenticated read/write mix over a 20-slot deterministic ring:
//   40% GET /me/preferences - 20% GET /me - 20% PATCH /me/preferences
//   15% GET /projects       -  5% GET /souls/cards
// One request per iteration (arrival rate == request rate, see preflight).
// PATCH writes are safe: each VU maps to its own bench user, and language is
// a benign field to churn.

import exec from 'k6/execution';
import { profileApi } from '../clients/profileApi.js';
import { expectStatus } from '../lib/checks.js';
import { crud429 } from '../lib/metrics.js';

const RING = [
  'getPrefs', 'getPrefs', 'getPrefs', 'getPrefs', 'getPrefs', 'getPrefs', 'getPrefs', 'getPrefs',
  'me', 'me', 'me', 'me',
  'patchPrefs', 'patchPrefs', 'patchPrefs', 'patchPrefs',
  'projects', 'projects', 'projects',
  'souls',
];

const LANGS = ['en', 'ru', 'de', 'fr'];

export function authCrud() {
  const it = exec.scenario.iterationInTest;
  const pick = RING[it % RING.length];
  let res;

  switch (pick) {
    case 'me':
      res = profileApi.me();
      expectStatus(res, 200, 'me');
      break;
    case 'patchPrefs':
      res = profileApi.patchPreferences({ language: LANGS[it % LANGS.length] });
      expectStatus(res, 200, 'patch preferences');
      break;
    case 'projects':
      res = profileApi.projects();
      expectStatus(res, 200, 'projects');
      break;
    case 'souls':
      res = profileApi.soulsCards();
      expectStatus(res, 200, 'souls cards');
      break;
    default:
      res = profileApi.getPreferences();
      expectStatus(res, 200, 'get preferences');
      break;
  }

  crud429.add(res.status === 429);
}
