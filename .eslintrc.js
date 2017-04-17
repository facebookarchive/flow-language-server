const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = 'eslint-rules';

module.exports = {
  extends: 'fbjs-opensource',
  plugins: ['import', 'prettier', 'rulesdir'],
  rules: {
    'consistent-return': 0, // handled by flow
    'import/no-duplicates': 2,
    'max-len': 0, // handled by prettier
    'no-duplicate-imports': 0,
    'prettier/prettier': ['error', 'fb', '@format'],
    'rulesdir/license-header': 2,
  },
};
