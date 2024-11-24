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

  loginUser(email, password) {
    return new Promise((resolve, reject) => {
      this.userService.getUserByEmail(email, (err, user) => {
        if (err || !user) {
          console.log('User not found or error:', err); 
          reject(new Error('Invalid credentials.'));
          return;
        }
  
  
        const hashedPassword = Utils.hashPassword(password);
        if (hashedPassword !== user.password) {
          console.log('Password mismatch'); 
          reject(new Error('Invalid credentials.'));
          return;
        }
  
        this.userService.getUserRoleById(user.id)
          .then((userRole) => {
            const token = jwt.sign({ id: user.id, email: user.email, userRole: userRole }, JWT_SECRET, {
              expiresIn: '1h',
            });
            resolve({ token, userId: user.id, userRole });
          })
          .catch((err) => {
            reject(new Error('Failed to retrieve user role.'));
          });
      });
    });
  }
  
  

  verifyToken(token, callback) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          callback(new Error('Token has expired.'), null);
        } else if (err.name === 'JsonWebTokenError') {
          callback(new Error('Invalid token.'), null);
        } else {
          callback(new Error('Token verification failed.'), null);
        }
      } else {
        callback(null, decoded);
      }
    });
  }
  
}

module.exports = AuthService;