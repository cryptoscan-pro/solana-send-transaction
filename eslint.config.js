import config from "@cryptoscan/eslint-config";

export default [
  ...config,
  {
    ignores: ["**/script"],
  },
];
