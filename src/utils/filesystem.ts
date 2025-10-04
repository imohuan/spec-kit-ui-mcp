import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * 生成唯一的会话 ID
 */
export function generateSessionId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * 检查 SpecKit 是否已初始化
 */
export function checkSpecKitInitialized(workDir: string): boolean {
  const specifyPath = path.join(workDir, '.specify', 'scripts', 'powershell');
  return existsSync(specifyPath);
}

/**
 * 初始化会话目录
 */
export function initializeSessionDirectory(sessionId: string, workDir: string): string {
  const cacheDir = path.join(workDir, '.specify', 'ui-cache');
  const sessionDir = path.join(cacheDir, sessionId);

  // 创建目录（递归创建）
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  if (!existsSync(sessionDir)) {
    mkdirSync(sessionDir, { recursive: true });
  }

  return sessionDir;
}

/**
 * 保存数据到 JSON 文件
 */
export function saveToJsonFile(sessionDir: string, filename: string, data: any): string {
  const filePath = path.join(sessionDir, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

/**
 * 从 JSON 文件读取数据
 */
export function loadFromJsonFile(filePath: string): any {
  if (!existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 从文件路径中提取 sessionId
 * 文件路径格式: .../ui-cache/{sessionId}/xxx-xxx-xxx.json
 */
export function extractSessionIdFromPath(filePath: string): string | null {
  const normalizedPath = path.normalize(filePath);
  const parts = normalizedPath.split(path.sep);

  // 找到 ui-cache 所在的索引
  const cacheIndex = parts.indexOf('ui-cache');
  if (cacheIndex === -1 || cacheIndex >= parts.length - 1) {
    return null;
  }

  // ui-cache 后面的就是 sessionId
  return parts[cacheIndex + 1];
}

/**
 * 获取下一个步骤编号
 * 通过扫描 sessionId 文件夹中所有文件，找到最大的步骤编号并+1
 */
export function getNextStepNumber(sessionId: string, workDir: string): number {
  const sessionDir = path.join(workDir, '.specify', 'ui-cache', sessionId);

  if (!existsSync(sessionDir)) {
    return 1; // 如果目录不存在，返回 1
  }

  const files = readdirSync(sessionDir);
  let maxStep = 0;

  // 遍历所有文件，提取步骤编号
  // 文件名格式: {步骤}-{工具名}-{类型}.{扩展名}
  for (const file of files) {
    const match = file.match(/^(\d+)-/);
    if (match) {
      const stepNum = parseInt(match[1], 10);
      if (stepNum > maxStep) {
        maxStep = stepNum;
      }
    }
  }

  return maxStep + 1;
}

