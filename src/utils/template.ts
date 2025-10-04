import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 替换模板变量
 */
export function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;

  // 处理条件块 {{#variable}}...{{/variable}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // 处理简单变量替换 {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : '';
  });

  return result;
}

/**
 * 读取提示词模板
 */
export function loadPromptTemplate(templateName: string): string {
  // prompts 目录在项目根目录
  const promptPath = path.join(__dirname, '..', '..', 'prompts', `${templateName}.md`);

  if (existsSync(promptPath)) {
    return readFileSync(promptPath, 'utf-8');
  } else {
    throw new Error(`提示词模板文件未找到: ${templateName}.md`);
  }
}

