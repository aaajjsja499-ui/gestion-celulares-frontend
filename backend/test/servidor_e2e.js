// Sirve el frontend y emula la API con el simulador de Apps Script (solo para pruebas locales)
const http = require('http'), fs = require('fs'), path = require('path');
const { mundo } = require('./lib');
const raiz = path.join(__dirname, '..', '..');
const w = mundo(5000000);
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
  if (req.method === 'POST') {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      w.ctx.__e = { postData: { contents: b } };
      const r = w.run('doPost(__e)');
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(r.t);
    }); return;
  }
  let u = req.url.split('?')[0]; if (u === '/') u = '/index.html';
  let f = path.join(raiz, u);
  if (u === '/config.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end('const CONFIG={APPS_SCRIPT_URL:"/api",NOMBRE_SISTEMA:"Prueba",VERSION:"e2e"};'); return; }
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(8765, () => console.log('listo'));
