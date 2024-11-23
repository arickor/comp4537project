/**
 * DISCLAIMER: This code was developed with assistance from ChatGPT by OpenAI.
 * Certain portions, including structure and functionality, were suggested or reviewed by ChatGPT.
 * Please review and test the code thoroughly to ensure it meets your requirements and security standards.
 */

const http = require('http');
const url = require('url');
const Database = require('./database');
const UserService = require('./userService');
const AuthService = require('./authService');

// Server with routes and middleware for handling requests
class Server {
  constructor(port, authService, userService) {
    this.port = port;
    this.authService = authService;
    this.userService = userService;
  }

  start() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const method = req.method;

      if (method === 'POST' && parsedUrl.pathname.endsWith('/login')) {
        this.handleLogin(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/register')) {
        this.handleRegister(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/get-security-question')) {
        this.handleGetSecurityQuestion(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/verify-security-answer')) {
        this.handleVerifySecurityAnswer(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/reset-password')) {
        this.handleResetPassword(req, res);
      } else if (method === 'GET' && parsedUrl.pathname.endsWith('/protected')) {
        this.handleProtectedRoute(req, res);
      } else if (method === 'GET' && parsedUrl.pathname.endsWith('/admin/users')) {
        this.handleAdminRoute(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/increment-api-count')) {
        this.handleIncrementApiCount(req, res);
      } else if (method === 'GET' && parsedUrl.pathname.endsWith('/get-api-count')) {
        this.handleGetApiCount(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found.' }));
      }
    });

    server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  handleLogin(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email, password } = JSON.parse(body);
      this.authService.loginUser(email, password, (err, token, userId) => {
        if (err) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials.' }));
        } else {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=3600`,
          });
          
          res.end(JSON.stringify({ userId, email }));
        }
      });
    });
  }

  handleRegister(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email, password, securityQuestion, answer } = JSON.parse(body);
      this.userService.registerUserWithSecurityQuestion(
        email,
        password,
        securityQuestion,
        answer.toLowerCase(),
        (err, result) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'Registration failed. Please try again.',
              })
            );
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Registration successful!' }));
          }
        }
      );
    });
  }

  handleGetSecurityQuestion(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email } = JSON.parse(body);
      this.userService.getSecurityQuestionByEmail(email, (err, question) => {
        if (err || !question) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email is not found.' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ question }));
        }
      });
    });
  }

  handleVerifySecurityAnswer(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email, answer } = JSON.parse(body);
      this.userService.getSecurityAnswerByEmail(email, (err, storedAnswer) => {
        if (err || !storedAnswer) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'User not found or answer not set.' })
          );
        } else if (storedAnswer.toLowerCase() !== answer.toLowerCase()) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please enter a correct answer.' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Answer verified successfully.' }));
        }
      });
    });
  }

  handleResetPassword(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email, newPassword } = JSON.parse(body);
      this.userService.resetPassword(email, newPassword, (err, success) => {
        if (err || !success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Password reset failed.' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Password reset successful.' }));
        }
      });
    });
  }

  handleProtectedRoute(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authorization header missing' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired token' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'Access granted to protected route',
            user: decoded,
          })
        );
      }
    });
  }

  handleIncrementApiCount(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { email } = JSON.parse(body);
      this.userService.incrementApiCount(email, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error incrementing API count' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'API count incremented',
          })
        );
      });
    });
  }

  handleGetApiCount(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authorization header missing' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired token' }));
        return;
      }

      const email = decoded.email;
      this.userService.getApiCount(email, (err, apiCount) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to retrieve API count' }));
          return;
        }

        // Check if API count is over the limit
        const MAX_API_CALLS = 20;
        let warning = null;
        if (apiCount > MAX_API_CALLS) {
          warning = 'You have exceeded the limit of 20 free API calls.';
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ apiCount, warning }));
      });
    });
  }

  handleAdminRoute(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authorization header missing' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    this.authService.verifyToken(token, (err, decoded) => {
      if (err || decoded.email !== 'admin@admin.com') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized access' }));
        return;
      }

      this.userService.getAllUsers((err, results) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch user data' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users: results }));
      });
    });
  }
}

// Configuration and initialization
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'dhwjddms12',
  database: 'arickorc_comp4537project',
};

const db = new Database(dbConfig);
db.connect();
db.createUsersTable();
db.createApiCallCountTable();
db.createTotalApiCallsByEndPointAndMethod();

const userService = new UserService(db);
const authService = new AuthService(userService);
const server = new Server(8080, authService, userService);

server.start();

module.exports = Server;
