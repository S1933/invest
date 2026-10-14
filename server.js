#!/usr/bin/env node
/**
 * Invest — Production server
 * Serves static files + proxies /api/yahoo/* to Yahoo Finance.
 * Run: node server.js [port]
 */

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = parseInt(process.argv[2], 10) || 3000
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

// ── Serve static file ─────────────────────────────────────────────
function serveStatic(urlPath, res) {
  // Strip trailing slash, default to index.html
  let filePath = urlPath === '/' ? '/index.html' : urlPath
  filePath = path.join(DIST, filePath)

  // Security: prevent path traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      // SPA fallback: serve index.html for any unmatched path
      const index = path.join(DIST, 'index.html')
      fs.readFile(index, (err2, data) => {
        if (err2) {
          res.writeHead(404)
          res.end('Not Found')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(data)
      })
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    fs.createReadStream(filePath).pipe(res)
  })
}

// ── Proxy Yahoo Finance ───────────────────────────────────────────
function proxyYahoo(apiPath, query, res) {
  // apiPath = /v8/finance/chart/SYMBOL
  const targetPath = apiPath + (query ? '?' + query : '')
  const targetUrl = new URL(targetPath, 'https://query1.finance.yahoo.com')

  const options = {
    hostname: 'query1.finance.yahoo.com',
    port: 443,
    path: targetUrl.pathname + targetUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  }

  const proxyReq = https.request(options, (proxyRes) => {
    // Forward Yahoo status + headers
    const headers = { ...proxyRes.headers }
    delete headers['transfer-encoding'] // let Node handle it
    res.writeHead(proxyRes.statusCode, headers)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
    res.writeHead(502)
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }))
  })

  proxyReq.end()
}

// ── HTTP Server ───────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname
  const query = url.searchParams.toString()

  // Same-origin CORS only; the wildcard let any site read the Yahoo proxy.
  res.setHeader('Access-Control-Allow-Origin', 'https://invest.gastronomie-domicile.fr')
  if (pathname.startsWith('/api/yahoo')) {
    // Audit fix IN-01: only the chart endpoint is allowed — anything else used
    // to forward verbatim to Yahoo (open relay, scraping pivot).
    if (req.method !== 'GET') {
      res.writeHead(405)
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))
      return
    }
    const chartOk = /^\/api\/yahoo\/v8\/finance\/chart\/[^/?#]+$/.test(pathname)
    if (!chartOk) {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Not Found' }))
      return
    }
    const apiPath = pathname.replace('/api/yahoo', '')
    proxyYahoo(apiPath, query, res)
  } else {
    serveStatic(pathname, res)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Invest server running on http://127.0.0.1:${PORT}`)
  console.log(`  Static: ${DIST}`)
  console.log(`  Proxy:  /api/yahoo/* → query1.finance.yahoo.com`)
})