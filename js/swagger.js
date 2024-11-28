const fs = require('fs');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');
const swaggerDocument = require('../docs/emotionalSwagger.json');

const swaggerUiPath = swaggerUiDist.absolutePath();

const handleSwaggerRoutes = (req, res) => {
  if (req.url === '/api-docs') {
    const indexPath = path.join(swaggerUiPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error loading Swagger UI:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
        return;
      }

      const modifiedHtml = data
        .replace(/href="([^"]+)"/g, 'href="/api-docs/$1"')
        .replace(/src="([^"]+)"/g, 'src="/api-docs/$1"');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(modifiedHtml);
    });
    return true;
  }

  if (req.url === '/api-docs/swagger-initializer.js') {
    console.log('Serving modified swagger-initializer.js');
    const initializerContent = `
      window.onload = function() {
        // Swagger UI configuration
        const ui = SwaggerUIBundle({
          url: "https://arickor.com/comp4537/project/backend/v1/docs/emotionalSwagger.json", // Point to your Swagger JSON
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout"
        });
        window.ui = ui;
      };
    `;

    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(initializerContent);
    return true;
  }

  if (req.url.startsWith('/api-docs/')) {
    const filePath = path.join(swaggerUiPath, req.url.replace('/api-docs/', ''));
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return true;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
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
      res.end(content);
    });
    return true;
  }

  if (req.url === '/swagger.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerDocument));
    return true;
  }

  return false;
};

module.exports = handleSwaggerRoutes;
