const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      config.env.NODE_APP_URL = process.env.NODE_APP_URL || config.env.NODE_APP_URL;
      return config;
    },
  },
});
