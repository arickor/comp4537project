/**
 * DISCLAIMER: This code was developed with assistance from ChatGPT by OpenAI.
 * Certain portions, including structure and functionality, were suggested or reviewed by ChatGPT.
 * Please review and test the code thoroughly to ensure it meets your requirements and security standards.
 */

require("dotenv").config();
const http = require("http");
const url = require("url");
const Database = require("./database");

const UserService = require("./userService");
const AuthService = require("./authService");
const ColorService = require("./colorService");
const ApiService = require("./apiService");

const SeedData = require("./seed");
const Utils = require("./utils");

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
        "Access-Control-Allow-Origin",
        "https://4537project-s2p-2-hackc2gjbxgzhpcn.canadacentral-01.azurewebsites.net"
        // "http://localhost:3000"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, credentials"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin":
          "https://4537project-s2p-2-hackc2gjbxgzhpcn.canadacentral-01.azurewebsites.net",
          // "http://localhost:3000",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, credentials",
          "Access-Control-Allow-Credentials": "true",
        });
        res.end();
        return;
      }

      const parsedUrl = url.parse(req.url, true);
      const method = req.method;

      if (method === "POST" && parsedUrl.pathname.endsWith("/login")) {
        this.handleLogin(req, res);
      } else if (method === "POST" && parsedUrl.pathname.endsWith("/logout")) {
        this.logoutUser(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/register")
      ) {
        this.handleRegister(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/get-security-question")
      ) {
        this.handleGetSecurityQuestion(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/verify-security-answer")
      ) {
        this.handleVerifySecurityAnswer(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/reset-password")
      ) {
        this.handleResetPassword(req, res);
      } else if (
        method === "GET" &&
        parsedUrl.pathname.endsWith("/protected")
      ) {
        this.handleProtectedRoute(req, res);
      } else if (
        method === "GET" &&
        parsedUrl.pathname.endsWith("/admin/users")
      ) {
        this.handleAdminRoute(req, res);
      } else if (method === "GET" && parsedUrl.pathname.endsWith("/color")) {
        this.handleColorRoute(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/color-by-emotion")
      ) {
        this.handleColorByEmotionRoute(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/add-color")
      ) {
        this.handleAddColorRoute(req, res);
      } else if (
        method === "PATCH" &&
        parsedUrl.pathname.endsWith("/edit-color")
      ) {
        this.handleEditColorRoute(req, res);
      } else if (
        method === "DELETE" &&
        parsedUrl.pathname.endsWith("/delete-color")
      ) {
        this.handleDeleteColorRoute(req, res);
      } else if (
        method === "POST" &&
        parsedUrl.pathname.endsWith("/increment-api-count")
      ) {
        this.handleIncrementApiCount(req, res);
      } else if (
        method === "GET" &&
        parsedUrl.pathname.endsWith("/get-api-count")
      ) {
        this.handleGetApiCount(req, res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Route not found." }));
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
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for the color route
      this.apiService.incrementApiStats(userId, "/color", "GET");

      this.colorService
        .getEmotionAndColorByUserId(userId)
        .then((results) => {
          console.log(results);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ colors: results }));
        })
        .catch((error) => {
          console.error("Error fetching color data:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Failed to fetch color data" }));
        });
    });
  }

  handleColorByEmotionRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      const userId = decoded.id;

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        const { emotion } = JSON.parse(body);
        this.colorService
          .getColorByUserIdAndEmotion(userId, emotion)
          .then((results) => {
            this.apiService.incrementApiStats(userId, '/color-by-emotion', 'POST');
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ color: results }));
          })
          .catch((error) => {
            console.error("Error fetching color data:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to fetch color data" }));
          });
      });
    });
  }

  handleEditColorRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        console.log("body", body);
        const { userId, emotion, color } = JSON.parse(body);
        this.colorService
          .editColorByUserIdAndEmotion(userId, emotion, color)
          .then((results) => {
            this.apiService.incrementApiStats(userId, '/edit-color', 'PATCH');
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Color data updated successfully" })
            );
          })
          .catch((err) => {
            console.error("Error updating color:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to edit color data" }));
          });
      });
    });
  }

  handleAddColorRoute(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { userId, emotion, color } = JSON.parse(body);
      this.colorService
        .addColorByUserIdAndEmotion(userId, emotion, color)
        .then((results) => {
          this.apiService.incrementApiStats(userId, '/add-color', 'POST');
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Color data added successfully" }));
        })
        .catch((err) => {
          console.error("Error adding color:", err.message);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        });
    });
  }

  handleDeleteColorRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        const { userId, emotion } = JSON.parse(body);

        this.colorService
          .deleteColorByUserIdAndEmotion(userId, emotion)
          .then((results) => {
            this.apiService.incrementApiStats(userId, '/delete-color', 'DELETE');
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Color data deleted successfully" })
            );
          })
          .catch((err) => {
            console.error("Error deleting color:", err.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to delete color data" }));
          });
      });
    });
  }

  handleLogin(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);
        const { token, userId, userRole } = await this.authService.loginUser(
          email,
          password
        );

        // Increment API stats after successful login
        this.apiService.incrementApiStats(userId, "/login", "POST");

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Set-Cookie": `jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=3600`,
        });
        res.end(JSON.stringify({ userId, email, userRole }));
      } catch (err) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }

  logoutUser(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for logout
      this.apiService.incrementApiStats(userId, "/logout", "POST");

      res.writeHead(200, {
        "Set-Cookie": "jwt=; HttpOnly; Secure; Path=/; Max-Age=0",
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ message: "Successfully logged out" }));
    });
  }

  handleRegister(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, password, securityQuestion, answer } = JSON.parse(body);
      this.userService.registerUserWithSecurityQuestion(
        email,
        password,
        securityQuestion,
        answer.toLowerCase(),
        (err, result) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Registration failed. Please try again.",
              })
            );
          } else {
            // Increment API stats for register
            this.apiService.incrementApiStats(result.insertId, "/register", "POST");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Registration successful!" }));
          }
        }
      );
    });
  }

  handleGetApiCount(req, res) {
    const result = 1;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result }));
  }

  handleGetSecurityQuestion(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email } = JSON.parse(body);
      this.userService.getSecurityQuestionByEmail(email, (err, question) => {
        if (err || !question) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Email is not found." }));
        } else {
          // Increment API stats for get-security-question
          this.apiServiceapiService.incrementApiStats(null, "/get-security-question", "POST");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ question }));
        }
      });
    });
  }

  handleAdminRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err || decoded.userRole !== "admin") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
        return;
      }

      const userId = decoded.id;

      // Increment API stats for admin route
      this.apiService.incrementApiStats(userId, "/admin/users", "GET");

      // Fetch both endpoint and user stats
      this.apiService.getApiStats((err, stats) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch stats' }));
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

  handleVerifySecurityAnswer(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, answer } = JSON.parse(body);
      this.userService.getSecurityAnswerByEmail(email, (err, storedAnswer) => {
        if (err || !storedAnswer) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "User not found or answer not set." })
          );
        } else if (storedAnswer.toLowerCase() !== answer.toLowerCase()) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Please enter a correct answer." }));
        } else {
          // Increment API stats for verify-security-answer
          this.apiService.incrementApiStats(null, "/verify-security-answer", "POST");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Answer verified successfully." }));
        }
      });
    });
  }

  handleResetPassword(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, newPassword } = JSON.parse(body);
      this.userService.resetPassword(email, newPassword, (err, success) => {
        if (err || !success) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Password reset failed." }));
        } else {
          // Increment API stats for reset-password
          this.apiService.incrementApiStats(null, "/reset-password", "POST");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Password reset successful." }));
        }
      });
    });
  }

  handleProtectedRoute(req, res) {
    const cookies = Utils.parseCookies(req);
    const token = cookies.jwt;

    this.authService.verifyToken(token, (err, decoded) => {
      if (err) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized access" }));
      } else {
        const userId = decoded.id;

        // Increment API stats for protected route
        this.apiService.incrementApiStats(userId, "/protected", "GET");

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
seed.seedUserRole(1, "user");
seed.seedUserRole(2, "admin");

const userService = new UserService(db);
const authService = new AuthService(userService);
const colorService = new ColorService(db);
const apiService = new ApiService(db);
const server = new Server(process.env.PORT || 8080, authService, userService, colorService, apiService);

server.start();

module.exports = Server;
