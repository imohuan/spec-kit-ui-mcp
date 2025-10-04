#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) {
      log(`❌ 命令执行失败: ${command}`, 'red');
      throw error;
    }
    return null;
  }
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writePackageJson(data) {
  writeFileSync(packageJsonPath, JSON.stringify(data, null, 2) + '\n');
}

function getCurrentVersion() {
  const pkg = readPackageJson();
  return pkg.version;
}

function getNpmVersion(packageName) {
  try {
    const result = exec(`npm view ${packageName} version`, { silent: true, ignoreError: true });
    return result ? result.trim() : null;
  } catch (error) {
    return null;
  }
}

function compareVersions(v1, v2) {
  if (!v2) return 1; // 如果npm上没有版本，本地版本更新

  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      return version;
  }

  return parts.join('.');
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function checkGitStatus() {
  const status = exec('git status --porcelain', { silent: true });
  return status ? status.trim() : '';
}

function checkGitBranch() {
  const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true });
  return branch ? branch.trim() : '';
}

async function main() {
  log('\n🚀 开始发布流程...\n', 'bright');

  // 1. 检查是否在Git仓库中
  try {
    exec('git rev-parse --git-dir', { silent: true });
  } catch (error) {
    log('❌ 当前目录不是Git仓库', 'red');
    process.exit(1);
  }

  // 2. 检查当前分支
  const currentBranch = checkGitBranch();
  log(`📍 当前分支: ${currentBranch}`, 'cyan');

  // 3. 检查Git工作区状态
  const gitStatus = checkGitStatus();
  if (gitStatus) {
    log('\n⚠️  检测到未提交的更改:', 'yellow');
    console.log(gitStatus);

    const answer = await askQuestion('\n是否继续? 未提交的更改将被包含在发布中 (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      log('❌ 发布已取消', 'red');
      process.exit(0);
    }
  }

  // 4. 读取当前版本
  const pkg = readPackageJson();
  const currentVersion = pkg.version;
  const packageName = pkg.name;

  log(`\n📦 包名: ${packageName}`, 'cyan');
  log(`📌 当前版本: ${currentVersion}`, 'cyan');

  // 5. 检查npm上的版本
  log('\n🔍 检查npm上的版本...', 'blue');
  const npmVersion = getNpmVersion(packageName);

  if (npmVersion) {
    log(`📌 npm版本: ${npmVersion}`, 'cyan');

    // 比较版本
    const comparison = compareVersions(currentVersion, npmVersion);
    if (comparison < 0) {
      log(`\n⚠️  警告: 本地版本 (${currentVersion}) 低于npm版本 (${npmVersion})`, 'yellow');
    } else if (comparison === 0) {
      log(`\n⚠️  本地版本与npm版本相同，需要更新版本号`, 'yellow');
    } else {
      log(`\n✅ 本地版本高于npm版本`, 'green');
    }
  } else {
    log('📌 npm上未找到已发布的版本（首次发布）', 'yellow');
  }

  // 6. 询问是否需要更新版本
  let newVersion = currentVersion;
  const baseVersion = npmVersion || currentVersion;

  if (!npmVersion || compareVersions(currentVersion, npmVersion) <= 0) {
    log('\n请选择版本更新类型:', 'bright');
    log(`  1. patch (补丁) - ${baseVersion} -> ${incrementVersion(baseVersion, 'patch')}`);
    log(`  2. minor (次版本) - ${baseVersion} -> ${incrementVersion(baseVersion, 'minor')}`);
    log(`  3. major (主版本) - ${baseVersion} -> ${incrementVersion(baseVersion, 'major')}`);
    log(`  4. custom (自定义版本)`);
    log(`  5. skip (跳过，使用当前版本)`);

    const choice = await askQuestion('\n请输入选项 (1-5): ');

    switch (choice) {
      case '1':
        newVersion = incrementVersion(baseVersion, 'patch');
        break;
      case '2':
        newVersion = incrementVersion(baseVersion, 'minor');
        break;
      case '3':
        newVersion = incrementVersion(baseVersion, 'major');
        break;
      case '4':
        newVersion = await askQuestion('请输入新版本号: ');
        if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
          log('❌ 无效的版本号格式，必须是 x.y.z 格式', 'red');
          process.exit(1);
        }
        break;
      case '5':
        log('\n⏭️  跳过版本更新', 'yellow');
        if (compareVersions(currentVersion, npmVersion) <= 0) {
          log('❌ 错误: 版本号必须高于npm上的版本才能发布', 'red');
          process.exit(1);
        }
        break;
      default:
        log('❌ 无效的选项', 'red');
        process.exit(1);
    }

    // 更新package.json中的版本
    if (newVersion !== currentVersion) {
      log(`\n📝 更新版本号: ${currentVersion} -> ${newVersion}`, 'blue');
      pkg.version = newVersion;
      writePackageJson(pkg);
      log('✅ package.json 已更新', 'green');
    }
  }

  // 7. 确认发布信息
  log('\n📋 发布信息:', 'bright');
  log(`   包名: ${packageName}`);
  log(`   版本: ${newVersion}`);
  log(`   分支: ${currentBranch}`);

  const confirmPublish = await askQuestion('\n确认发布? (y/n): ');
  if (confirmPublish.toLowerCase() !== 'y') {
    log('❌ 发布已取消', 'red');
    process.exit(0);
  }

  // 8. 构建项目
  log('\n🔨 构建项目...', 'blue');
  exec('npm run build');
  log('✅ 构建完成', 'green');

  // 9. Git提交
  if (gitStatus || newVersion !== currentVersion) {
    log('\n📝 提交更改到Git...', 'blue');
    exec('git add .');
    exec(`git commit -m "chore: release v${newVersion}"`);
    log('✅ Git提交完成', 'green');
  }

  // 10. 创建Git标签
  log('\n🏷️  创建Git标签...', 'blue');
  exec(`git tag v${newVersion}`, { ignoreError: true });
  log('✅ Git标签创建完成', 'green');

  // 11. 推送到GitHub
  log('\n⬆️  推送到GitHub...', 'blue');
  try {
    exec(`git push origin ${currentBranch}`);
    exec(`git push origin v${newVersion}`);
    log('✅ 推送到GitHub完成', 'green');
  } catch (error) {
    log('⚠️  推送到GitHub失败，但会继续发布到npm', 'yellow');
  }

  // 12. 发布到npm
  log('\n📤 发布到npm...', 'blue');

  // 检查是否已登录npm
  try {
    exec('npm whoami', { silent: true });
  } catch (error) {
    log('⚠️  未登录npm，请先登录', 'yellow');
    exec('npm login');
  }

  // 发布
  try {
    exec('npm publish');
    log('✅ 发布到npm完成', 'green');
  } catch (error) {
    log('❌ 发布到npm失败', 'red');
    throw error;
  }

  // 13. 完成
  log('\n🎉 发布成功！', 'bright');
  log(`\n📦 包名: ${packageName}`, 'cyan');
  log(`🔖 版本: v${newVersion}`, 'cyan');
  log(`🌐 npm: https://www.npmjs.com/package/${packageName}`, 'cyan');
  log(`📚 GitHub: ${pkg.repository?.url?.replace('git+', '').replace('.git', '')}`, 'cyan');
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log('\n❌ 发生错误:', 'red');
  console.error(error);
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  log('\n❌ 发布失败:', 'red');
  console.error(error);
  process.exit(1);
});

