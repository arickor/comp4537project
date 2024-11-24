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
const ColorService = require('./colorService');

const SeedData = require('./seed');
const Utils = require('./utils');

// Server with routes and middleware for handling requests
class Server {
  constructor(port, authService, userService) {
    this.port = port;
    this.authService = authService;
    this.userService = userService;
    this.colorService = colorService;
  }

  start() {
    const server = http.createServer((req, res) => {
      const localHost = 'http://localhost:3000';
      res.setHeader('Access-Control-Allow-Origin', localHost);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, credentials',
      );

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': localHost,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, credentials',
        });
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const method = req.method;

      if (method === 'POST' && parsedUrl.pathname.endsWith('/login')) {
        this.handleLogin(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/logout')) {
        this.logoutUser(req, res);
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
      } else if (method === 'GET' && parsedUrl.pathname.endsWith('/color')) {
        this.handleColorRoute(req, res);
      } else if (method === 'POST' && parsedUrl.pathname.endsWith('/add-color')) {
        this.handleAddColorRoute(req, res);
      } else if (method === 'PATCH' && parsedUrl.pathname.endsWith('/edit-color')) {
        this.handleEditColorRoute(req, res);
      } else if (method === 'DELETE' && parsedUrl.pathname.endsWith('/delete-color')) {
        this.handleDeleteColorRoute(req, res);
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

  // Color
  handleColorRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized access' }));
        return;
      }

      const userId = decoded.id;

      this.colorService
        .getEmotionAndColorByUserId(userId)
        .then((results) => {
          console.log(results);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ colors: results }));
        })
        .catch((error) => {
          console.error('Error fetching color data:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch color data' }));
        });
    });
  }

  handleEditColorRoute(req, res) {
  const cookies = Utils.parseCookies(req);
  const token = cookies.jwt;

  this.authService.verifyToken(token, (err, decoded) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized access' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
        console.log('body', body);
        const { userId, emotion, color } = JSON.parse(body);
        this.colorService
          .editColorByUserIdAndEmotion(userId, emotion, color)
          .then((results) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({ message: 'Color data updated successfully' })
            );
          })
          .catch((err) => {
            console.error('Error updating color:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to edit color data' }));
          });
    });
  });
}


  handleAddColorRoute(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { userId, emotion, color } = JSON.parse(body);
      this.colorService
        .addColorByUserIdAndEmotion(userId, emotion, color)
        .then((results) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Color data added successfully' }));
        })
        .catch((err) => {
          console.error('Error adding color:', err.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
    });
  }
  

handleDeleteColorRoute(req, res) {
  const cookies = Utils.parseCookies(req);
  const token = cookies.jwt;

  this.authService.verifyToken(token, (err, decoded) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized access' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
        const { userId, emotion } = JSON.parse(body);

        this.colorService
          .deleteColorByUserIdAndEmotion(userId, emotion)
          .then((results) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({ message: 'Color data deleted successfully' })
            );
          })
          .catch((err) => {
            console.error('Error deleting color:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to delete color data' }));
          });
    });
  });
}

  handleLogin(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        const { token, userId, userRole } = await this.authService.loginUser(email, password);
  
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=3600`,
        });
        res.end(JSON.stringify({ userId, email, userRole }));
      } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }

  logoutUser(req, res) {
    res.writeHead(200, {
      'Set-Cookie': 'jwt=; HttpOnly; Secure; Path=/; Max-Age=0',
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ message: 'Successfully logged out' }));
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

  //
  handleGetApiCount(req, res) {
    const result = 1;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
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

  handleAdminRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err || decoded.userRole !== 'admin') {
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
  password: '12',
  database: 'arickorc_comp4537project',
};

const db = new Database(dbConfig);
db.connect();
db.createUsersTable();
db.createApiCallCountTable();
db.createTotalApiCallsByEndPointAndMethod();
db.createUserRolesTable();
db.createColorTableByUserIdAndEmotion();

// Seed user and admin data
const seed = new SeedData(db);
seed.seedUser();
seed.seedAdmin();

const userService = new UserService(db);
const authService = new AuthService(userService);
const colorService = new ColorService(db);
const server = new Server(8080, authService, userService);

server.start();

module.exports = Server;
