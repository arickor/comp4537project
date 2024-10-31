const http = require("http");
const url = require("url");
const mysql = require("mysql");

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  connect() {
    this.connection.connect((err) => {
      if (err) throw err;
      console.log("Connected to database!");
    });
  }

  createUsersTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(150) NOT NULL
      ) ENGINE=MyISAM;
    `;

    this.connection.query(createQuery, (err) => {
      if (err) throw err;
      console.log("Users table ready!");

      // Check if table is empty and insert admin user if needed
      const checkEmptyQuery = "SELECT COUNT(*) AS count FROM Users";
      this.connection.query(checkEmptyQuery, (err, result) => {
        if (err) throw err;

        const isEmpty = result[0].count === 0;
        if (isEmpty) {
          const insertAdminQuery =
            "INSERT INTO Users (email, password) VALUES (?, ?)";
          this.connection.query(
            insertAdminQuery,
            ["admin@admin.com", "111"],
            (err) => {
              if (err) throw err;
              console.log("Admin user added to Users table.");
            }
          );
        }
      });
    });
  }

  executeQuery(query, values, callback) {
    this.connection.query(query, values, (err, result) => {
      if (err) callback(err, null);
      else callback(null, result);
    });
  }
}

class UserService {
  constructor(database) {
    this.database = database;
  }

  registerUser(email, password, callback) {
    const query = "INSERT INTO Users (email, password) VALUES (?, ?)";
    this.database.executeQuery(query, [email, password], callback);
  }

  getUserById(userId, callback) {
    const query = "SELECT * FROM Users WHERE id = ?";
    this.database.executeQuery(query, [userId], callback);
  }

  updateUser(userId, email, password, callback) {
    const query = "UPDATE Users SET email = ?, password = ? WHERE id = ?";
    this.database.executeQuery(query, [email, password, userId], callback);
  }

  deleteUser(userId, callback) {
    const query = "DELETE FROM Users WHERE id = ?";
    this.database.executeQuery(query, [userId], callback);
  }
}

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

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  if (method === "POST" && parsedUrl.pathname === "/register") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(body);
      userService.registerUser(email, password, (err, result) => {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: "User registered successfully!",
              userId: result.insertId,
            })
          );
        }
      });
    });
  } else if (method === "GET" && parsedUrl.pathname === "/user") {
    const userId = parsedUrl.query.id;
    userService.getUserById(userId, (err, result) => {
      if (err || result.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result[0]));
      }
    });
  } else if (method === "PUT" && parsedUrl.pathname === "/user") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { id, email, password } = JSON.parse(body);
      userService.updateUser(id, email, password, (err, result) => {
        if (err || result.affectedRows === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Update failed or user not found" }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: "User updated successfully" }));
        }
      });
    });
  } else if (method === "DELETE" && parsedUrl.pathname === "/user") {
    const userId = parsedUrl.query.id;
    userService.deleteUser(userId, (err, result) => {
      if (err || result.affectedRows === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found or deletion failed" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: "User deleted successfully" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
