# AURA.transcript - High-Fidelity Auto Git Sync Engine
# This script stages, commits, and pushes your active workspace changes directly to GitHub.

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     🎙️ AURA.transcript - GIT SYNC ENGINE     " -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Check Git Status
$status = git status --porcelain
if (-not $status) {
    Write-Host "[Sync] Workspace is clean. No modifications detected." -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Cyan
    Exit
}

Write-Host "[Sync] Unstaged modifications detected in workspace:" -ForegroundColor Yellow
git status -s
Write-Host "---------------------------------------------" -ForegroundColor Gray

# 2. Stage All Modifications
Write-Host "[Sync] Staging all files..." -ForegroundColor Gray
git add -A

# 3. Request or Generate Commit Message
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$defaultMsg = "Workspace Auto-Sync: $timestamp"

Write-Host ""
Write-Host "Enter commit message (Or press ENTER for auto-timestamp):" -ForegroundColor White
$msg = Read-Host
if (-not $msg) {
    $msg = $defaultMsg
}

# 4. Commit Changes
Write-Host ""
Write-Host "[Sync] Committing changes..." -ForegroundColor Gray
git commit -m "$msg"

# 5. Push to GitHub
# Retrieve current active branch name
$branch = git branch --show-current
Write-Host "[Sync] Pushing vector changes to GitHub branch: '$branch'..." -ForegroundColor Magenta

$pushResult = git push origin $branch 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "  🚀 Sync Completed! Changes are now live on GitHub." -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "  ⚠️ Push Failed. Check your network or SSH keys." -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
}
