# 📦 发布到 npm

## 🚀 快速发布（推荐）

使用自动化发布脚本，一键完成版本检查、构建、提交、推送和发布。

### 基础用法

```bash
# 交互式发布（默认）
npm run push

# 自动化发布（跳过确认）
npm run push -- --yes --patch

# 查看帮助
npm run push -- --help
```

### 常用命令速查

| 使用场景                       | 命令                             |
| ------------------------------ | -------------------------------- |
| 修复 bug，发布补丁版本         | `npm run push -- --yes --patch`  |
| 新增功能，发布次版本           | `npm run push -- --yes --minor`  |
| 重大更新，发布主版本           | `npm run push -- --yes --major`  |
| 指定版本号                     | `npm run push -- -y -v 1.5.0`    |
| 跳过最终确认（仍交互选择版本） | `npm run push -- --skip-confirm` |
| CI/CD 自动发布                 | `npm run push -- --yes --patch`  |

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

### 命令行参数

脚本支持以下命令行参数来跳过确认步骤：

| 参数                 | 简写          | 说明                            |
| -------------------- | ------------- | ------------------------------- |
| `--yes`              | `-y`          | 跳过所有确认提示                |
| `--skip-confirm`     | -             | 跳过最终发布确认                |
| `--skip-git-check`   | -             | 跳过 Git 状态检查确认           |
| `--patch`            | -             | 自动选择 patch 版本更新 (x.y.Z) |
| `--minor`            | -             | 自动选择 minor 版本更新 (x.Y.0) |
| `--major`            | -             | 自动选择 major 版本更新 (X.0.0) |
| `--version <版本号>` | `-v <版本号>` | 指定自定义版本号 (格式: x.y.z)  |
| `--help`             | `-h`          | 显示帮助信息                    |

**参数使用示例：**

```bash
# 跳过所有确认，自动使用 patch 版本
npm run push -- --yes --patch

# 指定版本号并跳过确认
npm run push -- -y --version 1.5.0

# 只跳过最终确认，使用 minor 版本
npm run push -- --skip-confirm --minor

# 查看帮助信息
npm run push -- --help
```

### 使用示例

#### 交互式发布（默认）

```bash
$ npm run push

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

#### 自动化发布（使用参数）

```bash
# 场景 1: CI/CD 自动发布 patch 版本
$ npm run push -- --yes --patch

🚀 开始发布流程...

📝 使用的参数:
   • --yes (跳过所有确认)
   • --patch (补丁版本)

📍 当前分支: main
📦 包名: spec-kit-ui-mcp
📌 当前版本: 1.0.2

🔍 检查npm上的版本...
📌 npm版本: 1.0.2

📝 自动选择 patch 版本: 1.0.2 -> 1.0.3

📝 更新版本号: 1.0.2 -> 1.0.3
✅ package.json 已更新

📋 发布信息:
   包名: spec-kit-ui-mcp
   版本: 1.0.3
   分支: main

✅ 自动确认发布（使用 --yes 或 --skip-confirm 参数）

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
```

```bash
# 场景 2: 指定版本号快速发布
$ npm run push -- -y -v 2.0.0

📝 使用的参数:
   • --yes (跳过所有确认)
   • --version 2.0.0 (自定义版本)

📝 使用指定版本号: 2.0.0
✅ 自动确认发布
🎉 发布成功！
```

```bash
# 场景 3: 只跳过最终确认（仍会交互选择版本）
$ npm run push -- --skip-confirm

🚀 开始发布流程...

📝 使用的参数:
   • --skip-confirm (跳过发布确认)

请选择版本更新类型:
  1. patch (补丁) - 1.0.3 -> 1.0.4
  2. minor (次版本) - 1.0.3 -> 1.1.0
  3. major (主版本) - 1.0.3 -> 2.0.0
  4. custom (自定义版本)
  5. skip (跳过，使用当前版本)

请输入选项 (1-5): 2

📝 更新版本号: 1.0.3 -> 1.1.0
✅ package.json 已更新

✅ 自动确认发布（使用 --yes 或 --skip-confirm 参数）
🎉 发布成功！
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

## 🤖 关于自动化发布脚本

### 脚本功能详解

自动化发布脚本 (`scripts/publish.js` 和 `scripts/publish.ps1`) 提供以下功能：

#### 1. 版本检查和对比

- 自动获取 npm 上的最新版本
- 对比本地和远程版本
- 防止发布低于或等于已发布的版本

#### 2. 智能版本更新

- 支持语义化版本更新（patch/minor/major）
- 支持自定义版本号
- 自动更新 `package.json`

#### 3. 完整的发布流程

- 自动构建项目
- 自动提交到 Git
- 自动创建版本标签
- 自动推送到 GitHub
- 自动发布到 npm

#### 4. 安全检查

- 检查 Git 工作区状态
- 检查当前分支
- 确认后再执行发布
- 检查 npm 登录状态

### 脚本使用注意事项

#### ✅ 使用前确认

1. **已登录 npm**

   ```bash
   npm whoami
   ```

2. **Git 配置正确**

   ```bash
   git config user.name
   git config user.email
   ```

3. **有 GitHub 推送权限**
   ```bash
   git remote -v
   ```

#### ⚠️ 常见问题

**Q: PowerShell 脚本无法执行？**

A: 需要修改 PowerShell 执行策略：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Q: 发布失败但版本已更新？**

A: 可以手动回滚版本：

1. 修改 `package.json` 中的版本号
2. 提交更改：`git add package.json && git commit -m "chore: revert version"`

**Q: 想跳过 GitHub 推送？**

A: 可以在脚本中注释掉推送部分，或使用手动发布流程。

**Q: 如何取消已发布的版本？**

A: npm 不允许删除已发布的版本（安全考虑），但可以废弃：

```bash
npm deprecate package-name@version "理由"
```

#### 🔧 自定义脚本

如果需要自定义发布流程，可以修改 `scripts/publish.js` 或 `scripts/publish.ps1`：

```javascript
// 例如：跳过 Git 标签创建
// 注释掉这一行：
// exec(`git tag v${newVersion}`);

// 例如：添加发布前测试
// 在构建前添加：
// log('\n🧪 运行测试...', 'blue');
// exec('npm test');
```

### CI/CD 集成

脚本支持命令行参数，可以轻松集成到 CI/CD 流程中：

#### GitHub Actions 示例

```yaml
name: Publish to npm

on:
  push:
    branches:
      - main
    paths:
      - "package.json"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm install

      - name: Publish to npm
        run: npm run push -- --yes --patch
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### GitLab CI 示例

```yaml
publish:
  stage: deploy
  only:
    - main
  script:
    - npm install
    - npm run push -- --yes --patch
  variables:
    NPM_TOKEN: $CI_NPM_TOKEN
```

#### Jenkins 示例

```groovy
pipeline {
    agent any
    stages {
        stage('Publish') {
            steps {
                sh 'npm install'
                sh 'npm run push -- --yes --patch'
            }
        }
    }
}
```

### 脚本优势

相比手动发布或使用 `npm version` 命令：

| 特性       | 手动发布 | npm version | 自动化脚本 |
| ---------- | -------- | ----------- | ---------- |
| 版本检查   | ❌       | ❌          | ✅         |
| 版本对比   | ❌       | ❌          | ✅         |
| 交互式选择 | ❌       | ❌          | ✅         |
| 自动构建   | 手动     | ❌          | ✅         |
| 自动推送   | 手动     | ✅          | ✅         |
| 自动发布   | 手动     | ❌          | ✅         |
| 状态检查   | 手动     | ❌          | ✅         |
| 彩色输出   | ❌       | ❌          | ✅         |
| 错误处理   | ❌       | ⚠️          | ✅         |

---

**祝发布顺利！** 🚀
