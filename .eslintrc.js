const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = 'eslint-rules';

module.exports = {
  parser: 'babel-eslint',
  extends: 'fbjs-opensource',
  plugins: ['babel', 'import', 'prettier', 'rulesdir'],
  rules: {
    'object-curly-spacing': 0, // false positives with export, use babel plugin's
    'babel/object-curly-spacing': 2, // false positives with export, use babel plugin's
    'consistent-return': 0, // handled by flow
    'import/no-duplicates': 2,
    'max-len': 0, // handled by prettier
    'no-duplicate-imports': 0,
    'prettier/prettier': ['error'],
    'rulesdir/license-header': 2,
  },
};
