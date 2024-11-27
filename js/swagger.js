const fs = require('fs');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');
const swaggerDocument = require('../docs/emotionalSwagger.json');

// Swagger UI 정적 파일 경로
const swaggerUiPath = swaggerUiDist.absolutePath();

const handleSwaggerRoutes = (req, res) => {
  if (req.url === '/swagger.json') {
    // Swagger JSON 반환
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerDocument));
    return true;
  }

  if (req.url === '/api-docs') {
    // Swagger UI 메인 페이지(index.html) 반환
    const indexPath = path.join(swaggerUiPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading Swagger UI');
        return;
      }

      // 기본 JSON URL을 /swagger.json으로 변경
      const modifiedHtml = data.replace(
        'url: "https://petstore.swagger.io/v2/swagger.json"',
        'url: "/swagger.json"'
      );

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(modifiedHtml);
    });
    return true;
  }

  if (req.url.startsWith('/api-docs/')) {
    // 정적 파일 서빙 (CSS, JS 등)
    const filePath = path.join(
      swaggerUiPath,
      req.url.replace('/api-docs/', '') // /api-docs/ 제거
    );

    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error(`File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }

      // 파일 확장자를 기준으로 Content-Type 설정
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

  return false; // Swagger 경로가 아닌 경우 false 반환
};

module.exports = handleSwaggerRoutes;
