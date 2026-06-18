/**
 * 本地同步服务器
 *
 * 发布页面通过 GitHub API 将文章推送到远程后，调用此服务器将文件同步到本地文件系统，
 * 使 Docusaurus 开发服务器能立即感知新文章。
 *
 * 使用方式：
 *   1. 启动：node scripts/local-sync-server.mjs
 *   2. 发布页面发布成功后 POST 到 http://localhost:3456/sync
 *
 * 请求体格式：
 *   { "path": "docs/algorithm/xxx.md", "content": "---\ntitle: ...\n---\n..." }
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.SYNC_PORT || 3456;

// 防抖：连续多次同步只触发一次数据重新生成
let regenerateTimer = null;
function scheduleRegenerate() {
  if (regenerateTimer) clearTimeout(regenerateTimer);
  regenerateTimer = setTimeout(() => {
    const child = spawn('node', ['scripts/generate-data.js'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('[sync] ✓ 数据已重新生成，HMR 将自动刷新页面');
      } else {
        console.error(`[sync] ✗ 数据生成失败 (exit ${code})`);
      }
    });
  }, 1000);
}

/**
 * 写入文件到本地 docs 目录
 */
function writeLocalFile(filePath, content) {
  const fullPath = path.resolve(PROJECT_ROOT, filePath);

  // 安全检查：确保文件路径在 docs/ 目录下
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(path.resolve(PROJECT_ROOT, 'docs'))) {
    throw new Error('不允许写入 docs/ 目录之外的文件');
  }

  // 确保目录存在
  const dir = path.dirname(normalized);
  fs.mkdirSync(dir, { recursive: true });

  // 写入文件
  fs.writeFileSync(normalized, content, 'utf-8');
  return fullPath;
}

/**
 * 解析请求体
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('无效的 JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 发送 JSON 响应
 */
function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: '仅支持 POST 请求' });
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  switch (url.pathname) {
    case '/sync': {
      try {
        const { path: filePath, content } = await parseBody(req);
        if (!filePath || content === undefined) {
          sendJson(res, 400, { error: '缺少必需字段: path, content' });
          return;
        }

        const fullPath = writeLocalFile(filePath, content);
        console.log(`[sync] ✓ 已写入: ${fullPath}`);
        // 自动重新生成 blog-data.json（防抖，发布系列文章时避免重复生成）
        scheduleRegenerate();
        sendJson(res, 200, { success: true, path: fullPath });
      } catch (err) {
        console.error(`[sync] ✗ 错误: ${err.message}`);
        sendJson(res, 500, { error: err.message });
      }
      break;
    }

    case '/git-pull': {
      try {
        const { execSync } = await import('node:child_process');
        const output = execSync('git pull origin master', {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
        });
        console.log(`[sync] ✓ git pull 完成`);
        sendJson(res, 200, { success: true, output: output.trim() });
      } catch (err) {
        console.error(`[sync] ✗ git pull 失败: ${err.message}`);
        sendJson(res, 500, { error: err.message });
      }
      break;
    }

    default:
      sendJson(res, 404, { error: '未知端点' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  🔄 本地同步服务器已启动: http://localhost:${PORT}`);
  console.log(`  📁 同步目录: ${PROJECT_ROOT}/docs/\n`);
});
