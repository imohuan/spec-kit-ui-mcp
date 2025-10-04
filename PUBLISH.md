# 📦 发布到 npm

## 🚀 快速发布（推荐）

使用自动化发布脚本，一键完成版本检查、构建、提交、推送和发布：

### Node.js 脚本（推荐，跨平台）

```bash
npm run publish:release
```

### PowerShell 脚本（Windows 用户备选）

```powershell
.\scripts\publish.ps1
```

### 直接使用 Node 脚本

```bash
node scripts/publish.js
```

该脚本会自动：

1. ✅ 检查 Git 仓库状态和当前分支
2. ✅ 对比本地版本和 npm 已发布版本
3. ✅ 提供交互式版本更新选项（patch/minor/major/custom）
4. ✅ 自动更新 `package.json` 的版本号
5. ✅ 构建项目（`npm run build`）
6. ✅ 提交更改到 Git
7. ✅ 创建版本标签（如 `v1.0.2`）
8. ✅ 推送到 GitHub
9. ✅ 发布到 npm

### 版本更新类型

脚本会提示你选择版本更新类型：

- **patch**（补丁）：修复 bug，如 `1.0.0` → `1.0.1`
- **minor**（次版本）：新增功能，如 `1.0.0` → `1.1.0`
- **major**（主版本）：重大变更，如 `1.0.0` → `2.0.0`
- **custom**（自定义）：手动输入版本号
- **skip**（跳过）：使用当前版本号（仅当本地版本已高于 npm 版本时）

### 使用示例

```bash
$ npm run publish:release

🚀 开始发布流程...

📍 当前分支: main
📦 包名: spec-kit-ui-mcp
📌 当前版本: 1.0.1

🔍 检查npm上的版本...
📌 npm版本: 1.0.0

✅ 本地版本高于npm版本

请选择版本更新类型:
  1. patch (补丁) - 1.0.1 -> 1.0.2
  2. minor (次版本) - 1.0.1 -> 1.1.0
  3. major (主版本) - 1.0.1 -> 2.0.0
  4. custom (自定义版本)
  5. skip (跳过，使用当前版本)

请输入选项 (1-5): 1

📝 更新版本号: 1.0.1 -> 1.0.2
✅ package.json 已更新

📋 发布信息:
   包名: spec-kit-ui-mcp
   版本: 1.0.2
   分支: main

确认发布? (y/n): y

🔨 构建项目...
✅ 构建完成

📝 提交更改到Git...
✅ Git提交完成

🏷️  创建Git标签...
✅ Git标签创建完成

⬆️  推送到GitHub...
✅ 推送到GitHub完成

📤 发布到npm...
✅ 发布到npm完成

🎉 发布成功！

📦 包名: spec-kit-ui-mcp
🔖 版本: v1.0.2
🌐 npm: https://www.npmjs.com/package/spec-kit-ui-mcp
📚 GitHub: https://github.com/imohuan/spec-kit-ui-mcp
```

---

## 📋 手动发布步骤

如果你想手动控制每个步骤，可以按照以下流程操作。

## 前置准备

### 1. 注册 npm 账号

访问 [npm 官网](https://www.npmjs.com/) 注册账号并验证邮箱。

### 2. 登录 npm

```bash
npm login
```

验证登录：

```bash
npm whoami
```

## 手动发布步骤

### 1. 更新 package.json

修改以下字段：

```json
{
  "name": "spec-kit-ui-mcp",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/spec-kit-ui-mcp.git"
  },
  "homepage": "https://github.com/yourusername/spec-kit-ui-mcp#readme",
  "bugs": {
    "url": "https://github.com/yourusername/spec-kit-ui-mcp/issues"
  }
}
```

### 2. 检查包名可用性

```bash
npm view spec-kit-ui-mcp
```

如果显示 404，说明包名可用。

### 3. 构建项目

```bash
npm run build
```

### 4. 本地测试

```bash
# 打包
npm pack

# 测试安装
npm install -g ./spec-kit-ui-mcp-1.0.0.tgz

# 测试运行
spec-kit-ui-mcp --help
```

### 5. 发布到 npm

```bash
npm publish
```

如果是作用域包（如 `@yourname/spec-kit-ui-mcp`），需要：

```bash
npm publish --access public
```

### 6. 验证发布

```bash
# 查看包信息
npm view spec-kit-ui-mcp

# 测试 npx 使用
npx spec-kit-ui-mcp@latest
```

## 🔄 版本更新

遵循[语义化版本](https://semver.org/lang/zh-CN/)：

```bash
# 修复 bug（1.0.0 → 1.0.1）
npm version patch
npm run build
npm publish

# 新增功能（1.0.0 → 1.1.0）
npm version minor
npm run build
npm publish

# 重大变更（1.0.0 → 2.0.0）
npm version major
npm run build
npm publish
```

## ✅ 发布检查清单

- [ ] `package.json` 信息完整（author、repository 等）
- [ ] 包名可用或已拥有权限
- [ ] `npm run build` 构建成功
- [ ] `npm pack` 打包测试通过
- [ ] 已登录 npm 账号
- [ ] README.md 文档完整
- [ ] LICENSE 文件存在

## ❌ 常见问题

### 包名已被占用

更改包名或使用作用域包：

```json
{
  "name": "@yourname/spec-kit-ui-mcp"
}
```

### 未登录 npm

```bash
npm login
```

### 版本号已存在

更新版本号：

```bash
npm version patch
```

## 🔐 安全建议

1. **启用双因素认证**

```bash
npm profile enable-2fa auth-and-writes
```

2. **检查敏感信息**
   - 确保 `.env` 在 `.gitignore` 中
   - 检查代码中没有硬编码密钥
   - 确认 `.npmignore` 正确配置

## 📞 获取帮助

- [npm 官方文档](https://docs.npmjs.com/)
- [npm 支持](https://www.npmjs.com/support)

---

**祝发布顺利！** 🚀
