# 📦 发布到 npm

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

## 📋 发布步骤

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
