const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

module.exports = {
  getEnv
};
