const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Utils = require('./utils');

// Configuration
const JWT_SECRET =
  '6c9fc76260e6d150380000d7ef8cf956401e90a6ec1e8bc0ac7843dcb57ec8679605796967a8266a98de78f2e815c80a1a16888f74ec381685b89eb5dac4485e';

// Authentication service for handling JWT creation and verification
class AuthService {
  constructor(userService) {
    this.userService = userService;
  }

  loginUser(email, password, callback) {
    this.userService.getUserByEmail(email, (err, user) => {
      if (err || !user || Utils.hashPassword(password) !== user.password) {
        callback(new Error('Invalid credentials.'), null);
        return;
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '1h',
      });
      callback(null, token, user.id);
    });
  }

  verifyToken(token, callback) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        callback(new Error('Invalid or expired token.'), null);
      } else {
        callback(null, decoded);
      }
    });
  }
}

module.exports = AuthService;