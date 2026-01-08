/** @type {import('prettier').Config} */
export const baseConfig = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  overrides: [
    {
      files: ["dist/**", ".next/**", "build/**"],
      options: {
        requirePragma: true, 
      },
    },
  ],
}