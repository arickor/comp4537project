const crypto = require('crypto');

class Utils {
  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static parseCookies(req) {
    const rawCookies = req.headers.cookie; 
    if (!rawCookies) return {};
  
    return rawCookies.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map((c) => c.trim());
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
  }

}

module.exports = Utils;