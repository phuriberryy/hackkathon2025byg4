module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings from node_modules
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /ENOENT: no such file or directory/,
      ]
      
      // Also remove source-map-loader from rules to prevent warnings
      webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use = rule.use.filter((use) => {
            if (typeof use === 'string') {
              return !use.includes('source-map-loader')
            }
            if (use.loader && use.loader.includes('source-map-loader')) {
              return false
            }
            return true
          })
        }
        return rule
      })
      
      return webpackConfig
    },
  },
}

