# PowerShell 发布脚本
# 用法: .\scripts\publish.ps1

# 设置错误时停止
$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Color {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-Color "✅ $Message" "Green" }
function Write-Info { param([string]$Message) Write-Color "📌 $Message" "Cyan" }
function Write-Warning { param([string]$Message) Write-Color "⚠️  $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-Color "❌ $Message" "Red" }
function Write-Header { param([string]$Message) Write-Color "`n$Message`n" "Magenta" }

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 执行命令并捕获错误
function Invoke-Command {
    param(
        [string]$Command,
        [switch]$Silent,
        [switch]$IgnoreError
    )
    try {
        if ($Silent) {
            $output = Invoke-Expression $Command 2>&1
            return $output
        } else {
            Invoke-Expression $Command
        }
    } catch {
        if (-not $IgnoreError) {
            Write-Error "命令执行失败: $Command"
            throw
        }
        return $null
    }
}

# 读取 package.json
function Get-PackageJson {
    $packagePath = Join-Path $PSScriptRoot "..\package.json"
    return Get-Content $packagePath | ConvertFrom-Json
}

# 写入 package.json
function Set-PackageJson {
    param($Data)
    $packagePath = Join-Path $PSScriptRoot "..\package.json"
    $Data | ConvertTo-Json -Depth 10 | Set-Content $packagePath
}

# 版本比较
function Compare-Version {
    param([string]$V1, [string]$V2)
    
    if (-not $V2) { return 1 }
    
    $parts1 = $V1.Split('.') | ForEach-Object { [int]$_ }
    $parts2 = $V2.Split('.') | ForEach-Object { [int]$_ }
    
    for ($i = 0; $i -lt 3; $i++) {
        if ($parts1[$i] -gt $parts2[$i]) { return 1 }
        if ($parts1[$i] -lt $parts2[$i]) { return -1 }
    }
    return 0
}

# 版本递增
function Update-Version {
    param(
        [string]$Version,
        [string]$Type
    )
    
    $parts = $Version.Split('.') | ForEach-Object { [int]$_ }
    
    switch ($Type) {
        "major" {
            $parts[0]++
            $parts[1] = 0
            $parts[2] = 0
        }
        "minor" {
            $parts[1]++
            $parts[2] = 0
        }
        "patch" {
            $parts[2]++
        }
    }
    
    return $parts -join '.'
}

# 主函数
function Main {
    Write-Header "🚀 开始发布流程..."

    # 1. 检查必要工具
    if (-not (Test-Command "git")) {
        Write-Error "未找到 Git，请先安装 Git"
        exit 1
    }
    if (-not (Test-Command "npm")) {
        Write-Error "未找到 npm，请先安装 Node.js"
        exit 1
    }

    # 2. 检查是否在Git仓库中
    try {
        Invoke-Command "git rev-parse --git-dir" -Silent | Out-Null
    } catch {
        Write-Error "当前目录不是Git仓库"
        exit 1
    }

    # 3. 检查当前分支
    $currentBranch = (Invoke-Command "git rev-parse --abbrev-ref HEAD" -Silent).Trim()
    Write-Info "当前分支: $currentBranch"

    # 4. 检查Git工作区状态
    $gitStatus = (Invoke-Command "git status --porcelain" -Silent).Trim()
    if ($gitStatus) {
        Write-Warning "检测到未提交的更改:"
        Write-Host $gitStatus
        
        $answer = Read-Host "`n是否继续? 未提交的更改将被包含在发布中 (y/n)"
        if ($answer -ne 'y') {
            Write-Error "发布已取消"
            exit 0
        }
    }

    # 5. 读取当前版本
    $pkg = Get-PackageJson
    $currentVersion = $pkg.version
    $packageName = $pkg.name
    
    Write-Info "`n包名: $packageName"
    Write-Info "当前版本: $currentVersion"

    # 6. 检查npm上的版本
    Write-Header "🔍 检查npm上的版本..."
    $npmVersion = $null
    try {
        $npmVersion = (npm view $packageName version 2>$null).Trim()
    } catch {
        $npmVersion = $null
    }
    
    if ($npmVersion) {
        Write-Info "npm版本: $npmVersion"
        
        $comparison = Compare-Version $currentVersion $npmVersion
        if ($comparison -lt 0) {
            Write-Warning "警告: 本地版本 ($currentVersion) 低于npm版本 ($npmVersion)"
        } elseif ($comparison -eq 0) {
            Write-Warning "本地版本与npm版本相同，需要更新版本号"
        } else {
            Write-Success "本地版本高于npm版本"
        }
    } else {
        Write-Warning "npm上未找到已发布的版本（首次发布）"
    }

    # 7. 询问是否需要更新版本
    $newVersion = $currentVersion
    $baseVersion = if ($npmVersion) { $npmVersion } else { $currentVersion }
    
    if (-not $npmVersion -or (Compare-Version $currentVersion $npmVersion) -le 0) {
        Write-Header "请选择版本更新类型:"
        Write-Host "  1. patch (补丁) - $baseVersion -> $(Update-Version $baseVersion 'patch')"
        Write-Host "  2. minor (次版本) - $baseVersion -> $(Update-Version $baseVersion 'minor')"
        Write-Host "  3. major (主版本) - $baseVersion -> $(Update-Version $baseVersion 'major')"
        Write-Host "  4. custom (自定义版本)"
        Write-Host "  5. skip (跳过，使用当前版本)"
        
        $choice = Read-Host "`n请输入选项 (1-5)"
        
        switch ($choice) {
            "1" { $newVersion = Update-Version $baseVersion "patch" }
            "2" { $newVersion = Update-Version $baseVersion "minor" }
            "3" { $newVersion = Update-Version $baseVersion "major" }
            "4" {
                $newVersion = Read-Host "请输入新版本号"
                if ($newVersion -notmatch '^\d+\.\d+\.\d+$') {
                    Write-Error "无效的版本号格式，必须是 x.y.z 格式"
                    exit 1
                }
            }
            "5" {
                Write-Warning "跳过版本更新"
                if ((Compare-Version $currentVersion $npmVersion) -le 0) {
                    Write-Error "错误: 版本号必须高于npm上的版本才能发布"
                    exit 1
                }
            }
            default {
                Write-Error "无效的选项"
                exit 1
            }
        }
        
        # 更新package.json中的版本
        if ($newVersion -ne $currentVersion) {
            Write-Info "`n更新版本号: $currentVersion -> $newVersion"
            $pkg.version = $newVersion
            Set-PackageJson $pkg
            Write-Success "package.json 已更新"
        }
    }

    # 8. 确认发布信息
    Write-Header "📋 发布信息:"
    Write-Host "   包名: $packageName"
    Write-Host "   版本: $newVersion"
    Write-Host "   分支: $currentBranch"
    
    $confirmPublish = Read-Host "`n确认发布? (y/n)"
    if ($confirmPublish -ne 'y') {
        Write-Error "发布已取消"
        exit 0
    }

    # 9. 进入项目根目录
    Set-Location (Join-Path $PSScriptRoot "..")

    # 10. 构建项目
    Write-Header "🔨 构建项目..."
    npm run build
    Write-Success "构建完成"

    # 11. Git提交
    if ($gitStatus -or ($newVersion -ne $currentVersion)) {
        Write-Header "📝 提交更改到Git..."
        git add .
        git commit -m "chore: release v$newVersion"
        Write-Success "Git提交完成"
    }

    # 12. 创建Git标签
    Write-Header "🏷️  创建Git标签..."
    try {
        git tag "v$newVersion" 2>$null
    } catch {
        Write-Warning "标签可能已存在"
    }
    Write-Success "Git标签创建完成"

    # 13. 推送到GitHub
    Write-Header "⬆️  推送到GitHub..."
    try {
        git push origin $currentBranch
        git push origin "v$newVersion"
        Write-Success "推送到GitHub完成"
    } catch {
        Write-Warning "推送到GitHub失败，但会继续发布到npm"
    }

    # 14. 发布到npm
    Write-Header "📤 发布到npm..."
    
    # 检查是否已登录npm
    try {
        npm whoami | Out-Null
    } catch {
        Write-Warning "未登录npm，请先登录"
        npm login
    }
    
    # 发布
    try {
        npm publish
        Write-Success "发布到npm完成"
    } catch {
        Write-Error "发布到npm失败"
        throw
    }

    # 15. 完成
    Write-Header "🎉 发布成功！"
    Write-Info "`n包名: $packageName"
    Write-Info "版本: v$newVersion"
    Write-Info "npm: https://www.npmjs.com/package/$packageName"
    if ($pkg.repository.url) {
        $repoUrl = $pkg.repository.url -replace 'git\+', '' -replace '\.git$', ''
        Write-Info "GitHub: $repoUrl"
    }
}

# 错误处理
try {
    Main
} catch {
    Write-Error "`n发布失败:"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

