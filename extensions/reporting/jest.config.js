const observations = require("../observations/jest.config");
module.exports = {
  ...observations,
  roots: ["<rootDir>/extensions/reporting"],
  testMatch: ["<rootDir>/extensions/reporting/src/**/*.test.[jt]s?(x)"],
};
