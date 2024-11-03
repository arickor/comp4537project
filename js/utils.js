const crypto = require('crypto');

class Utils {
  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

module.exports = Utils;