import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    plugins: {
      firebase: firebaseRulesPlugin
    },
    rules: {}
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
