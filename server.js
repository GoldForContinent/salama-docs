const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const URL_REWRITES = {
  "/": "/index.html",
  "/dashboard": "/dashboard.html",
  "/reportlost": "/reportlost.html",
  "/reportfound": "/reportfound.html",
  "/digital-locker": "/digital-locker.html",
  "/admin-dashboard": "/admin-dashboard.html",
  "/admin-login": "/admin-login.html",
  "/sysadmin": "/sysadmin-dashboard.html",
  "/sysadmin-dashboard": "/sysadmin-dashboard.html",
  "/station-dashboard": "/station-dashboard.html",
  "/station": "/station-dashboard.html",
  "/login": "/loginpage.html",
  "/signup": "/signup.html",
  "/about": "/about.html",
  "/contact": "/contact.html",
  "/faq": "/faq.html",
  "/help": "/help.html",
  "/privacy": "/privacy.html",
  "/terms": "/terms.html",
  "/settings": "/settings.html",
  "/debug": "/debug.html",
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Page Not Found</h1>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const isLoginPage = filePath.endsWith('admin-login.html') || filePath.endsWith('loginpage.html');
    const isAdminPage = filePath.includes('sysadmin-dashboard') || filePath.includes('station-dashboard') || filePath.includes('dashboard.html');
    const cacheControl = isAdminPage ? "no-store, no-cache, must-revalidate" : "public, max-age=300";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": isLoginPage ? "DENY" : "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' https://esm.sh https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://zfywzczelvbsoptwrrpj.supabase.co https://*.supabase.co wss://*.supabase.co; frame-src 'none';"
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  if (urlPath !== "/" && urlPath.endsWith("/")) {
    urlPath = urlPath.slice(0, -1);
  }

  let filePath;

  if (URL_REWRITES[urlPath]) {
    filePath = path.join(ROOT, URL_REWRITES[urlPath]);
  } else {
    const ext = path.extname(urlPath);
    if (ext) {
      filePath = path.join(ROOT, urlPath);
    } else {
      filePath = path.join(ROOT, urlPath + ".html");
    }
  }

  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(ROOT))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.access(resolvedPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Page Not Found</h1>");
    } else {
      serveFile(res, resolvedPath);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
