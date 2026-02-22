/** @type {import('@commitlint/types').UserConfig} */

const TASK_ID_RE = /\b[A-Z]{2,}[A-Z0-9]*-\d+\b/;
// e.g., TP-123, ABC1-9 (project key must start with 2+ letters, can include digits)
const TYPES_WITH_OPTIONAL_SCOPE = new Set(['chore', 'refactor']);

export default {
  extends: ['@commitlint/config-conventional'],

  // Ignore common bot bumps if you like
  ignores: [
    (msg: string) =>
      /^merge /i.test(msg) ||
      /^revert /i.test(msg) ||
      /^chore\(*\):/i.test(msg) ||
      /^chore\(release\):/i.test(msg) ||
      /^build\(*\):/i.test(msg),
  ],
  plugins: [
    {
      rules: {
      },
    },
  ],

  rules: {
    // Optional niceties—keep or tweak as you wish:
    'body-max-line-length': [0, 'always', 600],
    // Allow common subject styles incl. lowercase (so conventional commits pass)
    'subject-case': [2, 'always', ['lower-case', 'sentence-case', 'start-case', 'pascal-case']],

    // 🔒 Enforce task ID in scope for ALL types
    'scope-requires-task-id': [2, 'always'],
  },
};
