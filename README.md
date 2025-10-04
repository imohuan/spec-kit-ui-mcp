# Spec Kit UI MCP

> 交互式 MCP 服务器，通过可视化界面收集项目需求，自动生成 Spec Kit 7 条命令。

[![npm version](https://img.shields.io/npm/v/spec-kit-ui-mcp.svg)](https://www.npmjs.com/package/spec-kit-ui-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 🎯 智能需求收集 - 通过交互式网页表单收集项目需求
- 🤖 AI 驱动 - AI 根据描述自动生成针对性问题
- 📊 多回合对话 - 支持多轮问答，逐步完善需求
- 🎨 美观界面 - 现代化 UI 设计
- 📝 自动生成命令 - 基于需求自动生成 7 条 Spec Kit 命令
- 💾 会话管理 - 自动保存会话历史

## 📦 安装使用

### 在 Claude Desktop 中配置

编辑配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

添加配置：

```json
{
  "mcpServers": {
    "spec-kit-ui-mcp": {
      "command": "npx",
      "args": ["-y", "spec-kit-ui-mcp"],
      "env": {}
    }
  }
}
```

重启 Claude Desktop 即可使用。

### 使用示例

在对话中说：

```
我想做一个待办事项应用
```

AI 会自动：

1. 收集你的需求信息
2. 打开可视化配置界面
3. 分析需求完整性
4. 生成 7 条 Spec Kit 命令
5. 在网页中展示结果

## 🎯 生成的 7 条命令

1. `/constitution` - 项目原则和开发规范
2. `/specify` - 功能规格和用户故事
3. `/clarify` - 技术细节澄清
4. `/plan` - 技术实现方案
5. `/tasks` - 任务分解和评估
6. `/analyze` - 风险分析和缓解
7. `/implement` - 具体实现指导

## 🛠️ MCP 工具

| 工具                     | 说明                   |
| ------------------------ | ---------------------- |
| `gather`                 | 收集需求，生成问题配置 |
| `configure`              | 打开可视化配置界面     |
| `analyze`                | 分析需求完整性         |
| `build`                  | 生成 Spec Kit 命令     |
| `preview`                | 预览命令结果           |
| `learn_speckit_commands` | 学习 Spec Kit 命令     |

## 🔧 高级配置

### 指定工作目录

```json
{
  "mcpServers": {
    "spec-kit-ui-mcp": {
      "command": "npx",
      "args": ["-y", "spec-kit-ui-mcp", "--work-dir", "/path/to/project"]
    }
  }
}
```

### 会话数据存储

会话数据保存在：`.specify/ui-cache/`

```
.specify/
  └── ui-cache/
      └── session-20231204-123456/
          ├── 1-gather-request.json
          ├── 1-gather-response.json
          └── ...
```

## 💡 使用技巧

### 提供详细描述

```
✅ 好：我想做一个任务管理网站，包含看板视图、列表视图、
     团队协作功能，界面简约现代，支持暗色模式

❌ 不好：我想做一个网站
```

### 利用多轮对话

不用担心第一次说不清楚，AI 会通过多轮对话帮你完善需求。

## 🚀 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/spec-kit-ui-mcp.git
cd spec-kit-ui-mcp

# 安装依赖
npm install

# 构建
npm run build

# 开发模式
npm run dev
```

## 📝 发布到 npm

查看 [PUBLISH.md](./PUBLISH.md) 了解如何发布到 npm。

## 📄 许可证

[MIT](./LICENSE) © spec-kit-ui-mcp contributors

## 🙏 致谢

- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP SDK
- [Spec Kit](https://speckit.ai) - 开发方法论
- [Vue.js](https://vuejs.org) - 前端框架
- [Tailwind CSS](https://tailwindcss.com) - 样式框架

---

**如果有帮助，请给个 ⭐️ Star！**
