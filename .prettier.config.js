import baseConfig from '@lyintometa/prettier-config'

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  ...baseConfig,
  printWidth: 120,
  quoteProps: 'preserve',
}

export default config
