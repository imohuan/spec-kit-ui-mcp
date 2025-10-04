#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import express from "express";
import { createServer } from "http";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync, existsSync, readdirSync, statSync } from "fs";

// 导入工具函数
import { replaceTemplateVariables, loadPromptTemplate } from "./utils/template.js";
import {
  generateSessionId,
  checkSpecKitInitialized,
  initializeSessionDirectory,
  saveToJsonFile,
  loadFromJsonFile,
  extractSessionIdFromPath,
  getNextStepNumber
} from "./utils/filesystem.js";
import { formatUserAnswers } from "./utils/formatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局状态管理
let webServer: ReturnType<typeof createServer> | null = null;
let userResponseResolver: ((value: any) => void) | null = null;

// 工作目录 - 从命令行参数获取或使用当前目录
let workingDirectory: string = process.cwd();

// 工具名称映射（根据功能语义）
const TOOL_NAMES = {
  gather: 'gather',       // 收集需求信息
  configure: 'configure', // 配置需求详情
  analyze: 'analyze',     // 分析需求完整性
  build: 'build',         // 构建命令
  preview: 'preview',     // 预览最终结果
};

// 解析命令行参数
function parseArguments(): void {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--work-dir' && i + 1 < args.length) {
      workingDirectory = path.resolve(args[i + 1]);
      console.error(`工作目录设置为: ${workingDirectory}`);
    }
  }
}

// 生成文件名的辅助函数
function getFileName(step: number, toolName: string, type: 'request' | 'response' | 'prompt'): string {
  const ext = type === 'prompt' ? 'md' : 'json';
  return `${step}-${toolName}-${type}.${ext}`;
}

// MCP 服务器实例
const mcpServer = new McpServer({ name: "spec-kit-ui", version: "1.0.4", });

// 注册工具1：收集需求信息
mcpServer.registerTool(
  TOOL_NAMES.gather,
  {
    title: "收集需求信息",
    description: "收集用户的项目需求信息，生成结构化的需求问题配置。该工具会返回提示词，AI 根据提示词生成需求配置 JSON，然后调用 configure 工具让用户填写。支持多回合收集。",
    inputSchema: {
      projectIdea: z.string().describe("用户的项目想法描述，例如：我想做一个待办事项应用"),
      userResponse: z.string().optional().describe("用户之前填写的回答文本（可选），如果是第一次调用则不需要此参数"),
      previousFeedback: z.string().optional().describe("用户的修改意见（可选），如果是第一次调用则不需要此参数"),
      sessionId: z.string().optional().describe("会话ID（可选），如果提供则继续现有会话，否则创建新会话"),
    },
  },
  async ({ projectIdea, userResponse, previousFeedback, sessionId: providedSessionId }) => {
    // 1. 检查 SpecKit 是否已初始化
    if (!checkSpecKitInitialized(workingDirectory)) {
      return {
        content: [{
          type: "text",
          text: `❌ **错误：SpecKit 尚未初始化**\n\n请先在工作目录初始化 SpecKit。\n\n当前工作目录: \`${workingDirectory}\`\n\n您可以运行命令：\n\`\`\`bash\ncd ${workingDirectory}\nspeckit init\n\`\`\`\n\n或者使用 MCP 工具 \`check_speckit_init\` 获取更多帮助。`,
        }],
      };
    }

    // 2. 使用提供的 sessionId 或生成新的
    let sessionId: string;
    let sessionDir: string;

    if (providedSessionId) {
      // 继续现有会话
      sessionId = providedSessionId;
      sessionDir = path.join(workingDirectory, '.specify', 'ui-cache', sessionId);
      if (!existsSync(sessionDir)) {
        throw new Error(`会话目录不存在: ${sessionDir}`);
      }
    } else {
      // 创建新会话
      sessionId = generateSessionId();
      sessionDir = initializeSessionDirectory(sessionId, workingDirectory);
    }

    // 3. 获取下一个步骤编号
    const currentStep = getNextStepNumber(sessionId, workingDirectory);
    const toolName = TOOL_NAMES.gather;

    // 4. 保存输入参数到文件
    const inputData = {
      step: currentStep,
      projectIdea,
      userResponse: userResponse || null,
      previousFeedback: previousFeedback || null,
      timestamp: new Date().toISOString(),
    };
    const requestFileName = getFileName(currentStep, toolName, 'request');
    const inputFilePath = saveToJsonFile(sessionDir, requestFileName, inputData);

    // 5. 定义配置文件路径（AI 将写入此文件）
    const responseFileName = getFileName(currentStep, toolName, 'response');
    const configFilePath = path.join(sessionDir, responseFileName);

    // 6. 从模板文件加载提示词
    const template = loadPromptTemplate('gather');

    // 7. 替换变量
    const prompt = replaceTemplateVariables(template, {
      projectIdea,
      userResponse: userResponse || null,
      previousFeedback: previousFeedback || null,
      configFilePath: configFilePath,
    });

    // 8. 保存提示词到文件
    const promptFileName = getFileName(currentStep, toolName, 'prompt');
    const promptFilePath = path.join(sessionDir, promptFileName);
    writeFileSync(promptFilePath, prompt, 'utf-8');

    return { content: [{ type: "text", text: prompt, }], };
  }
);

// 注册工具2：配置需求详情
mcpServer.registerTool(
  TOOL_NAMES.configure,
  {
    title: "配置需求详情",
    description: "接收需求配置文件路径，打开可视化界面让用户填写需求详情。该工具会启动本地 Web 服务器，在浏览器中展示配置表单，等待用户填写并提交。",
    inputSchema: {
      configFilePath: z.string().describe("需求配置 JSON 文件的路径"),
    },
  },
  async ({ configFilePath }) => {
    // 从文件路径提取 sessionId
    const sessionId = extractSessionIdFromPath(configFilePath);
    if (!sessionId) {
      throw new Error(`无法从文件路径中提取 sessionId: ${configFilePath}`);
    }

    const sessionDir = path.join(workingDirectory, '.specify', 'ui-cache', sessionId);

    // 获取下一个步骤编号
    const currentStep = getNextStepNumber(sessionId, workingDirectory);
    const toolName = TOOL_NAMES.configure;

    // 从文件读取配置（验证文件有效性）
    const configJson = loadFromJsonFile(configFilePath);
    if (!configJson || typeof configJson !== "object") {
      throw new Error(`配置文件内容无效: ${configFilePath}`);
    }

    // 启动 Web 服务器（如果未启动）
    if (!webServer) {
      await startWebServer();
    }

    // 打开浏览器，通过 URL 参数传递配置文件路径
    const encodedPath = encodeURIComponent(configFilePath);
    await open(`http://localhost:3456/configure.html?configFilePath=${encodedPath}`);

    // 等待用户提交
    const userResponse = await new Promise((resolve) => {
      userResponseResolver = resolve;
    });

    // 保存用户回答到文件
    const responseFileName = getFileName(currentStep, toolName, 'response');
    const userResponseFilePath = saveToJsonFile(sessionDir, responseFileName, {
      step: currentStep,
      userResponse: userResponse,
      timestamp: new Date().toISOString(),
    });

    // 将用户回答转换为可读的文字格式
    const formattedAnswers = formatUserAnswers(userResponse);

    // 从模板文件加载提示词
    const template = loadPromptTemplate('configure');

    // 替换变量
    const prompt = replaceTemplateVariables(template, {
      userAnswers: formattedAnswers,
      userResponseFilePath: userResponseFilePath,
    });

    // 保存提示词到文件
    const promptFileName = getFileName(currentStep, toolName, 'prompt');
    const promptFilePath = path.join(sessionDir, promptFileName);
    writeFileSync(promptFilePath, prompt, 'utf-8');

    return {
      content: [{
        type: "text",
        text: prompt,
      }],
    };
  }
);

// 注册工具3：分析需求完整性
mcpServer.registerTool(
  TOOL_NAMES.analyze,
  {
    title: "分析需求完整性",
    description: "分析收集到的需求信息，判断是否足够完整和明确。如果需求明确，生成需求总结并指示构建命令；如果不明确，指示继续收集更多信息。",
    inputSchema: {
      projectIdea: z.string().describe("项目想法描述"),
      userAnswers: z.string().describe("用户当前回答的文本"),
      userResponseFilePath: z.string().describe("用户回答的响应文件路径（用于提取 sessionId）"),
    },
  },
  async ({ projectIdea, userAnswers, userResponseFilePath }) => {
    // 从文件路径提取 sessionId
    const sessionId = extractSessionIdFromPath(userResponseFilePath);
    if (!sessionId) {
      throw new Error(`无法从文件路径中提取 sessionId: ${userResponseFilePath}`);
    }

    const sessionDir = path.join(workingDirectory, '.specify', 'ui-cache', sessionId);

    // 获取下一个步骤编号
    const currentStep = getNextStepNumber(sessionId, workingDirectory);
    const toolName = TOOL_NAMES.analyze;

    // 保存输入参数到文件
    const inputData = {
      step: currentStep,
      projectIdea,
      userAnswers,
      timestamp: new Date().toISOString(),
    };
    const requestFileName = getFileName(currentStep, toolName, 'request');
    const inputFilePath = saveToJsonFile(sessionDir, requestFileName, inputData);

    // 定义需求总结文件路径（AI 将写入此文件）
    const responseFileName = getFileName(currentStep, toolName, 'response');
    const requirementsSummaryFilePath = path.join(sessionDir, responseFileName);

    // 从模板文件加载提示词
    const template = loadPromptTemplate('analyze');
    // 替换变量
    const prompt = replaceTemplateVariables(template, {
      projectIdea,
      userAnswers,
      requirementsSummaryFilePath: requirementsSummaryFilePath,
      sessionId: sessionId,
    });

    // 保存提示词到文件
    const promptFileName = getFileName(currentStep, toolName, 'prompt');
    const promptFilePath = path.join(sessionDir, promptFileName);
    writeFileSync(promptFilePath, prompt, 'utf-8');

    return {
      content: [{
        type: "text",
        text: prompt,
      }],
    };
  }
);

// 注册工具4：构建 Spec Kit 命令
mcpServer.registerTool(
  TOOL_NAMES.build,
  {
    title: "构建 Spec Kit 命令",
    description: "基于完整的需求总结构建 Spec Kit 7 条命令：/constitution、/specify、/clarify、/plan、/tasks、/analyze、/implement。使用 Vue 3 + TypeScript 技术栈，强调高可用、高性能、高可维护性。",
    inputSchema: {
      requirementsSummaryFilePath: z.string().describe("需求总结 JSON 文件路径"),
    },
  },
  async ({ requirementsSummaryFilePath }) => {
    // 从文件路径提取 sessionId
    const sessionId = extractSessionIdFromPath(requirementsSummaryFilePath);
    if (!sessionId) {
      throw new Error(`无法从文件路径中提取 sessionId: ${requirementsSummaryFilePath}`);
    }

    const sessionDir = path.join(workingDirectory, '.specify', 'ui-cache', sessionId);

    // 获取下一个步骤编号
    const currentStep = getNextStepNumber(sessionId, workingDirectory);
    const toolName = TOOL_NAMES.build;

    // 从文件读取需求总结
    const summaryData = loadFromJsonFile(requirementsSummaryFilePath);
    const projectIdea = summaryData.projectIdea || "";
    const requirementsSummary = summaryData.summary || summaryData.requirementsSummary || "";

    // 保存输入参数到文件
    const inputData = {
      step: currentStep,
      projectIdea,
      requirementsSummary,
      requirementsSummaryFilePath,
      timestamp: new Date().toISOString(),
    };
    const requestFileName = getFileName(currentStep, toolName, 'request');
    const inputFilePath = saveToJsonFile(sessionDir, requestFileName, inputData);

    // 定义命令输出文件路径（AI 将写入此文件）
    const responseFileName = getFileName(currentStep, toolName, 'response');
    const commandsFilePath = path.join(sessionDir, responseFileName);

    // 从模板文件加载提示词
    const template = loadPromptTemplate('build');
    // 替换变量
    const prompt = replaceTemplateVariables(template, {
      projectIdea,
      requirementsSummary,
      commandsFilePath: commandsFilePath,
    });

    // 保存提示词到文件
    const promptFileName = getFileName(currentStep, toolName, 'prompt');
    const promptFilePath = path.join(sessionDir, promptFileName);
    writeFileSync(promptFilePath, prompt, 'utf-8');

    return {
      content: [{
        type: "text",
        text: prompt,
      }],
    };
  }
);

// 注册工具5：快速了解 Spec Kit 指令
mcpServer.registerTool(
  "learn_speckit",
  {
    description: "快速了解 Spec Kit 的所有指令和开发流程。打开一个交互式网页，详细介绍每个命令的用途、使用方法和最佳实践。",
    inputSchema: {
      // MCP 要求至少有一个参数，即使是可选的
      _: z.string().optional().describe("无需参数"),
    },
  },
  async () => {
    // 启动 Web 服务器（如果未启动）
    if (!webServer) {
      await startWebServer();
    }

    // 打开学习指南页面
    await open("http://localhost:3456/learn.html");

    return {
      content: [
        {
          type: "text",
          text: "已打开 Spec Kit 学习指南页面！\n\n这个交互式指南包含：\n• 📚 所有 Spec Kit 命令的详细说明\n• 💡 每个命令的中文示例\n• 🎯 可视化的开发流程\n• 💭 实用的使用技巧\n\n请在浏览器中查看并学习各个命令的用法。",
        },
      ],
    };
  }
);

// 注册工具6：预览命令结果
mcpServer.registerTool(
  TOOL_NAMES.preview,
  {
    title: "预览命令结果",
    description: "接收命令结果文件路径，在网页中预览构建好的 7 条 Spec Kit 命令。用于在 build 构建命令后，以美观的方式展示结果，方便用户查看和复制。",
    inputSchema: {
      commandsFilePath: z.string().describe("命令结果 JSON 文件路径"),
    },
  },
  async ({ commandsFilePath }) => {
    // 从文件路径提取 sessionId
    const sessionId = extractSessionIdFromPath(commandsFilePath);
    if (!sessionId) {
      throw new Error(`无法从文件路径中提取 sessionId: ${commandsFilePath}`);
    }

    // 从文件读取命令结果（验证文件有效性）
    const commandsData = loadFromJsonFile(commandsFilePath);
    if (!commandsData || !commandsData.commands || !Array.isArray(commandsData.commands)) {
      throw new Error(`命令结果文件格式无效: ${commandsFilePath}`);
    }

    // 启动 Web 服务器（如果未启动）
    if (!webServer) {
      await startWebServer();
    }

    // 打开结果展示页面，通过 URL 参数传递命令文件路径
    const encodedPath = encodeURIComponent(commandsFilePath);
    await open(`http://localhost:3456/preview.html?commandsFilePath=${encodedPath}`);

    const commands = commandsData.commands;
    return {
      content: [
        {
          type: "text",
          text: `✨ **命令结果已展示**\n\n**命令结果文件**: \`${commandsFilePath}\`\n\n生成的命令包括：\n${commands.map((cmd: any) => `• ${cmd.id}`).join('\n')}\n\n已在浏览器中打开展示页面，您可以查看并复制这些命令。`,
        },
      ],
    };
  }
);

// 启动 Web 服务器
async function startWebServer(): Promise<void> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    // 根目录重定向到 intro.html（需要在 static 之前）
    app.get("/", (req, res) => {
      res.redirect("/intro.html");
    });

    // public 目录在项目根目录
    const publicPath = path.join(__dirname, "..", "public");
    app.use(express.static(publicPath));

    // API: 获取当前配置
    app.get("/api/config", (req, res) => {
      const configFilePath = req.query.configFilePath as string;
      if (!configFilePath) {
        res.status(400).json({ error: "缺少 configFilePath 参数" });
        return;
      }

      try {
        const configData = loadFromJsonFile(configFilePath);
        res.json(configData);
      } catch (error: any) {
        res.status(404).json({ error: `无法读取配置文件: ${error.message}` });
      }
    });

    // API: 提交用户回答
    app.post("/api/submit", (req, res) => {
      const userResponse = req.body;

      if (userResponseResolver) {
        userResponseResolver(userResponse);
        userResponseResolver = null;
      }

      res.json({ success: true });
    });

    // API: 获取命令生成结果
    app.get("/api/commands-result", (req, res) => {
      const commandsFilePath = req.query.commandsFilePath as string;
      if (!commandsFilePath) {
        res.status(400).json({ error: "缺少 commandsFilePath 参数" });
        return;
      }

      try {
        const commandsData = loadFromJsonFile(commandsFilePath);
        res.json(commandsData);
      } catch (error: any) {
        res.status(404).json({ error: `无法读取命令结果文件: ${error.message}` });
      }
    });

    // API: 获取所有配置文件列表（用于 configure.html）
    app.get("/api/gather-configs", (req, res) => {
      try {
        const uiCachePath = path.join(workingDirectory, '.specify', 'ui-cache');

        if (!existsSync(uiCachePath)) {
          res.json([]);
          return;
        }

        const configs = [];
        const sessionDirs = readdirSync(uiCachePath);

        for (const sessionId of sessionDirs) {
          const sessionPath = path.join(uiCachePath, sessionId);

          // 读取该会话目录下的所有文件
          if (!existsSync(sessionPath) || !statSync(sessionPath).isDirectory()) {
            continue;
          }

          const files = readdirSync(sessionPath);

          // 查找所有匹配 *-gather-response.json 的文件
          const gatherResponseFiles = files.filter((file: string) =>
            file.endsWith('-gather-response.json')
          );

          // 处理找到的所有 gather-response 文件
          for (const fileName of gatherResponseFiles) {
            const gatherResponsePath = path.join(sessionPath, fileName);
            try {
              const gatherData = loadFromJsonFile(gatherResponsePath);
              // 从文件名提取步骤编号，用于排序（取最新的）
              const stepNumber = parseInt(fileName.split('-')[0]) || 0;

              configs.push({
                sessionId,
                stepNumber,
                title: stepNumber + '-' + (gatherData.projectName || gatherData.projectIdea || '未命名项目'),
                projectIdea: gatherData.projectIdea || '',
                filePath: gatherResponsePath,
                fileName: fileName,
              });
            } catch (error) {
              // 忽略无法读取的文件
              console.error(`无法读取配置文件 ${gatherResponsePath}:`, error);
            }
          }
        }

        // 按步骤编号降序排序，优先显示最新的
        configs.sort((a: any, b: any) => b.stepNumber - a.stepNumber);

        res.json(configs);
      } catch (error: any) {
        res.status(500).json({ error: `获取配置列表失败: ${error.message}` });
      }
    });

    // API: 获取所有项目列表
    app.get("/api/projects", (req, res) => {
      try {
        const uiCachePath = path.join(workingDirectory, '.specify', 'ui-cache');

        if (!existsSync(uiCachePath)) {
          res.json([]);
          return;
        }

        const projects = [];
        const sessionDirs = readdirSync(uiCachePath);

        for (const sessionId of sessionDirs) {
          const sessionPath = path.join(uiCachePath, sessionId);

          // 读取该会话目录下的所有文件
          if (!existsSync(sessionPath) || !statSync(sessionPath).isDirectory()) {
            continue;
          }

          const files = readdirSync(sessionPath);

          // 查找所有匹配 *-build-response.json 的文件
          const buildResponseFiles = files.filter((file: string) =>
            file.endsWith('-build-response.json')
          );

          // 处理找到的所有 build-response 文件
          for (const fileName of buildResponseFiles) {
            const buildResponsePath = path.join(sessionPath, fileName);
            try {
              const buildData = loadFromJsonFile(buildResponsePath);
              // 从文件名提取步骤编号，用于排序（取最新的）
              const stepNumber = parseInt(fileName.split('-')[0]) || 0;

              projects.push({
                sessionId,
                stepNumber,
                title: stepNumber + '-' + (buildData.title || buildData.projectIdea || '未命名项目'),
                projectIdea: buildData.projectIdea || '',
                filePath: buildResponsePath,
                fileName: fileName,
              });
            } catch (error) {
              // 忽略无法读取的文件
              console.error(`无法读取项目文件 ${buildResponsePath}:`, error);
            }
          }
        }

        // 按步骤编号降序排序，优先显示最新的
        projects.sort((a: any, b: any) => b.stepNumber - a.stepNumber);

        res.json(projects);
      } catch (error: any) {
        res.status(500).json({ error: `获取项目列表失败: ${error.message}` });
      }
    });

    webServer = createServer(app);
    webServer.listen(3456, () => {
      console.error("Web 服务器已启动：http://localhost:3456");
      resolve();
    });
  });
}

// 启动 MCP 服务器
async function main() {
  // 解析命令行参数
  parseArguments();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("Spec Kit UI MCP 服务器已启动");
  console.error(`工作目录: ${workingDirectory}`);
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});

