const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = 'eslint-rules';

module.exports = {
  extends: 'fbjs-opensource',
  plugins: ['import', 'rulesdir'],
  rules: {
    'rulesdir/license-header': 2,
    'no-duplicate-imports': 0,
    'import/no-duplicates': 2,
  },
};
