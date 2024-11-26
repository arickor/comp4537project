class ApiService {
  constructor(database) {
    this.database = database;
  }

  incrementApiStats(userId, endpoint, method) {
    const userApiQuery = `
        INSERT INTO APICallCountByUserId (user_id, api_count)
        VALUES (?, 1)
        ON DUPLICATE KEY UPDATE api_count = api_count + 1;
      `;

    this.database.executeQuery(userApiQuery, [userId], (err) => {
      if (err) console.error("Error incrementing user API stats:", err.message);
    });

    const endpointQuery = `
        INSERT INTO EndpointStats (endpoint, method, request_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE request_count = request_count + 1;
      `;

    this.database.executeQuery(endpointQuery, [endpoint, method], (err) => {
      if (err) console.error("Error incrementing endpoint stats:", err.message);
    });
  }
}

module.exports = ApiService;
