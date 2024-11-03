/**
 * DISCLAIMER: This code was developed with assistance from ChatGPT by OpenAI.
 * Certain portions, including structure and functionality, were suggested or reviewed by ChatGPT.
 * Please review and test the code thoroughly to ensure it meets your requirements and security standards.
 */

const http = require("http");
const url = require("url");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const jwtSecret = crypto.randomBytes(64).toString("hex");
console.log(jwtSecret); // This will print a secure, random JWT secret

// Configuration
const JWT_SECRET =
  "6c9fc76260e6d150380000d7ef8cf956401e90a6ec1e8bc0ac7843dcb57ec8679605796967a8266a98de78f2e815c80a1a16888f74ec381685b89eb5dac4485e";

// Database Connection
class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  connect() {
    this.connection.connect((err) => {
      if (err) throw err;
      console.log('Connected to database!');
    });
  }

  executeQuery(query, params, callback) {
    this.connection.query(query, params, (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  }

  createUsersTable() {
    // Query to create the Users table if it doesn't exist
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(150) NOT NULL
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createUsersQuery, (err) => {
      if (err) throw err;
      console.log("Users table ready!");

      // Check if table is empty and insert admin user if needed
      const checkEmptyQuery = "SELECT COUNT(*) AS count FROM Users";
      this.connection.query(checkEmptyQuery, (err, result) => {
        if (err) throw err;

        if (result[0].count === 0) {
          const insertAdminQuery =
            "INSERT INTO Users (email, password) VALUES (?, ?)";
          this.connection.query(
            insertAdminQuery,
            ["admin@admin.com", hashPassword("111")],
            (err) => {
              if (err) throw err;
              console.log("Admin user added to Users table.");
            }
          );
        }
      });

      // Now create the SecurityQuestions table with a foreign key to Users table
      this.createSecurityQuestionsTable();
    });
  }

  createSecurityQuestionsTable() {
    // Query to create the SecurityQuestions table if it doesn't exist
    const createSecurityQuestionsQuery = `
      CREATE TABLE IF NOT EXISTS SecurityQuestions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question VARCHAR(150) NOT NULL,
        answer VARCHAR(150) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createSecurityQuestionsQuery, (err) => {
      if (err) throw err;
      console.log("SecurityQuestions table ready!");
    });
  }
}

// Helper function for password hashing
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// User service for managing user-related database operations
class UserService {
  constructor(database) {
    this.database = database;
  }

  registerUser(email, password, callback) {
    const hashedPassword = hashPassword(password);
    const query = "INSERT INTO Users (email, password) VALUES (?, ?)";
    this.database.executeQuery(query, [email, hashedPassword], callback);
  }

  getUserByEmail(email, callback) {
    const query = 'SELECT * FROM Users WHERE email = ?';
    this.database.executeQuery(query, [email], (err, results) => {
      if (err) {
        callback(err, null);
        return;
      }
      if (results.length > 0) {
        callback(null, results[0]);
      } else {
        callback(null, null);
      }
    });
  }
}

// Authentication service for handling JWT creation and verification
class AuthService {
  constructor(userService) {
    this.userService = userService;
  }

  loginUser(email, password, callback) {
    this.userService.getUserByEmail(email, (err, user) => {
      if (err || !user || hashPassword(password) !== user.password) {
        callback(new Error("Invalid credentials"), null);
        return;
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "1h",
      });
      callback(null, token);
    });
  }

  verifyToken(token, callback) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        callback(new Error("Invalid or expired token"), null);
      } else {
        callback(null, decoded);
      }
    });
  }
}

// Server with routes and middleware for handling requests
class Server {
  constructor(port, authService) {
    this.port = port;
    this.authService = authService;
  }

  start() {
    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const method = req.method;

      if (method === "POST" && parsedUrl.pathname === "/login") {
        this.handleLogin(req, res);
      } else if (method === "GET" && parsedUrl.pathname === "/protected") {
        this.handleProtectedRoute(req, res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Route not found" }));
      }
    });

    server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  handleLogin(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(body);
      this.authService.loginUser(email, password, (err, token) => {
        if (err) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ token }));
        }
      });
    });
  }

  handleProtectedRoute(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Authorization header missing" }));
      return;
    }

    const token = authHeader.split(" ")[1];
    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or expired token" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Access granted to protected route",
            user: decoded,
          })
        );
      }
    });
  }
}

// Configuration and initialization
const dbConfig = {
  host: "localhost",
  user: "arickorc_aric",
  password: "P@$$w0rd12345",
  database: "arickorc_comp4537project",
};

const db = new Database(dbConfig);
db.connect();
db.createUsersTable();

const userService = new UserService(db);
const authService = new AuthService(userService);
const server = new Server(8080, authService);

server.start();
