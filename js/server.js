/**
 * DISCLAIMER: This code was developed with assistance from ChatGPT by OpenAI.
 * Certain portions, including structure and functionality, were suggested or reviewed by ChatGPT.
 * Please review and test the code thoroughly to ensure it meets your requirements and security standards.
 */

require('dotenv').config();
const http = require('http');
const url = require('url');
const Database = require('./database');
const fs = require('fs');
const path = require('path');

const handleSwaggerRoutes = require('./swagger');

const UserService = require('./userService');
const AuthService = require('./authService');
const ColorService = require('./colorService');
const ApiService = require('./apiService');
const SeedData = require('./seed');
const Utils = require('./utils');
const messages = require('./lang/en/en');

// Server with routes and middleware for handling requests
class Server {
  constructor(port, authService, userService, colorService, apiService) {
    this.port = port;
    this.authService = authService;
    this.userService = userService;
    this.colorService = colorService;
    this.apiService = apiService;
  }

  start() {
    const server = http.createServer((req, res) => {
      res.setHeader(
        'Access-Control-Allow-Origin',
        // 'https://4537project-s2p-2-hackc2gjbxgzhpcn.canadacentral-01.azurewebsites.net'
        "http://localhost:3000"
      );
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, credentials'
      );

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin':
            // 'https://4537project-s2p-2-hackc2gjbxgzhpcn.canadacentral-01.azurewebsites.net',
          'http://localhost:3000',
          'Access-Control-Allow-Methods':
            'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, credentials',
          'Access-Control-Allow-Credentials': 'true',
        });
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const method = req.method;

      // if (pathname.startsWith("/api-docs")) {
      //   this.serveSwagger(req, res, pathname);
      //   return;
      // }

      if (handleSwaggerRoutes(req, res)) {
        return;
      }

      if (method === 'POST' && parsedUrl.pathname.endsWith('/login')) {
        this.handleLogin(req, res);
      }  else if (method === 'GET' && parsedUrl.pathname === '/validate-token') {
        this.handleTokenValidation(req, res);
      }
      else if (method === 'POST' && parsedUrl.pathname.endsWith('/logout')) {
        this.logoutUser(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/register')
      ) {
        this.handleRegister(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/get-security-question')
      ) {
        this.handleGetSecurityQuestion(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/verify-security-answer')
      ) {
        this.handleVerifySecurityAnswer(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/reset-password')
      ) {
        this.handleResetPassword(req, res);
      } else if (
        method === 'GET' &&
        parsedUrl.pathname.endsWith('/protected')
      ) {
        this.handleProtectedRoute(req, res);
      } else if (
        method === 'GET' &&
        parsedUrl.pathname.endsWith('/user/admin')
      ) {
        this.handleAdminRoute(req, res);
      } else if (method === 'GET' && parsedUrl.pathname.endsWith('/color')) {
        this.handleColorRoute(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/color-by-emotion')
      ) {
        this.handleColorByEmotionRoute(req, res);
      } else if (
        method === 'POST' &&
        parsedUrl.pathname.endsWith('/color/add')
      ) {
        this.handleAddColorRoute(req, res);
      } else if (
        method === 'PATCH' &&
        parsedUrl.pathname.endsWith('/color/edit')
      ) {
        this.handleEditColorRoute(req, res);
      } else if (
        method === 'DELETE' &&
        parsedUrl.pathname.endsWith('/color/delete')
      ) {
        this.handleDeleteColorRoute(req, res);
      } else if (
        method === 'GET' &&
        parsedUrl.pathname.endsWith('/user/profile')
      ) {
        this.handleProfileRoute(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.route }));
      }
    });

    server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  handleTokenValidation(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
      } else {
        const userId = decoded.id;

        // Increment API stats for token validation
        this.apiService.incrementApiStats(userId, '/', 'GET');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: messages.success.tokenValidation }));
      }
    });
  }

  // Color
  handleColorRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for the color route
      this.apiService.incrementApiStats(userId, '/color', 'GET');

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
          res.end(JSON.stringify({ error: messages.error.fetchColor }));
        });
    });
  }

  handleColorByEmotionRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      const userId = decoded.id;

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        const { emotion } = JSON.parse(body);
        this.colorService
          .getColorByUserIdAndEmotion(userId, emotion)
          .then((results) => {
            this.apiService.incrementApiStats(
              userId,
              '/color-by-emotion',
              'POST'
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ color: results }));
          })
          .catch((error) => {
            console.error('Error fetching color data:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.error.fetchColor }));
          });
      });
    });
  }

  handleEditColorRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        const { userId, emotion, color } = JSON.parse(body);
        this.colorService
          .editColorByUserIdAndEmotion(userId, emotion, color)
          .then((results) => {
            this.apiService.incrementApiStats(userId, '/color/edit', 'PATCH');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: messages.success.updateColor }));
          })
          .catch((err) => {
            console.error('Error updating color:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.error.editColor }));
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
          this.apiService.incrementApiStats(userId, '/color/add', 'POST');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: messages.success.addColor }));
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
        res.end(JSON.stringify({ error: messages.error.authorization }));
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
            this.apiService.incrementApiStats(
              userId,
              '/color/delete',
              'DELETE'
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: messages.success.deleteColor }));
          })
          .catch((err) => {
            console.error('Error deleting color:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.error.deleteColor }));
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
        const { token, userId, userRole } = await this.authService.loginUser(
          email,
          password
        );

        // Increment API stats after successful login
        this.apiService.incrementApiStats(userId, '/login', 'POST');

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
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for logout
      this.apiService.incrementApiStats(userId, '/logout', 'POST');

      res.writeHead(200, {
        'Set-Cookie': 'jwt=; HttpOnly; Secure; Path=/; Max-Age=0',
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ message: messages.success.logout }));
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
            res.end(JSON.stringify({ error: messages.error.register }));
          } else {
            // Increment API stats for register
            this.apiService.incrementApiStats(
              result.insertId,
              '/register',
              'POST'
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: messages.success.register }));
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
          res.end(JSON.stringify({ error: messages.error.emailNotFound }));
        } else {
          // Increment API stats for get-security-question
          this.apiServiceapiService.incrementApiStats(
            null,
            '/get-security-question',
            'POST'
          );

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
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for admin route
      this.apiService.incrementApiStats(userId, '/user/admin', 'GET');

      // Fetch both endpoint and user stats
      this.apiService.getApiStats((err, stats) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: messages.error.apiStats }));
          return;
        }

        // Use stats from callback
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            endpoints: stats.endpoints,
            users: stats.users,
          })
        );
      });
    });
  }

  handleProfileRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
        return;
      }

      const userId = decoded.id;

      this.userService.getUserById(userId, (err, user) => {
        if (err || !user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: messages.error.userNotFound }));
          return;
        }

        this.apiService.incrementApiStats(userId, '/user/profile', 'GET');

        // Fetch both endpoint and user stats
        this.apiService.getApiStats((err, stats) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.error.apiStats }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              user,
              users: stats.users,
            })
          );
        });
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
          res.end(JSON.stringify({ error: messages.error.userNotFound }));
        } else if (storedAnswer.toLowerCase() !== answer.toLowerCase()) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: messages.error.answer }));
        } else {
          // Increment API stats for verify-security-answer
          this.apiService.incrementApiStats(
            null,
            '/verify-security-answer',
            'POST'
          );

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: messages.success.answer }));
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
          res.end(JSON.stringify({ error: messages.error.resetPassword }));
        } else {
          // Increment API stats for reset-password
          this.apiService.incrementApiStats(null, '/reset-password', 'POST');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: messages.success.resetPassword }));
        }
      });
    });
  }

  handleProtectedRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: messages.error.authorization }));
      } else {
        const userId = decoded.id;

        // Increment API stats for protected route
        this.apiService.incrementApiStats(userId, '/protected', 'GET');

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

  serveSwagger(req, res, pathname) {
    if (pathname === '/api-docs') {
      // Serve the Swagger UI index.html
      fs.readFile(
        path.join(swaggerUiPath, 'index.html'),
        'utf8',
        (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading Swagger UI');
            return;
          }
          // Replace the default Swagger JSON URL with your actual Swagger JSON URL
          const modifiedHtml = data.replace(
            'url: "https://petstore.swagger.io/v2/swagger.json"',
            `url: "/swagger.json"`
          );
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(modifiedHtml);
        }
      );
    } else if (pathname === '/swagger.json') {
      // Serve the Swagger JSON document
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(swaggerDocument));
    } else {
      // Serve static files (CSS, JS, etc.) for Swagger UI
      const filePath = path.join(
        swaggerUiPath,
        pathname.replace('/api-docs', '')
      );
      fs.readFile(filePath, (err, fileContent) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }
        const ext = path.extname(filePath);
        const contentType =
          ext === '.css'
            ? 'text/css'
            : ext === '.js'
            ? 'application/javascript'
            : ext === '.html'
            ? 'text/html'
            : 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
      });
    }
  }
}

// Configuration and initialization
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const db = new Database(dbConfig);
db.connect();
db.initializeTables();

// Seed user and admin data
const seed = new SeedData(db);
seed.seedUser();
seed.seedAdmin();
seed.seedUserRole(1, 'user');
seed.seedUserRole(2, 'admin');

const userService = new UserService(db);
const authService = new AuthService(userService);
const colorService = new ColorService(db);
const apiService = new ApiService(db);
const server = new Server(
  process.env.PORT || 8080,
  authService,
  userService,
  colorService,
  apiService
);

server.start();

// const app = express();
// const PORT = process.env.PORT || 3030;

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
//   console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
// });

module.exports = Server;
