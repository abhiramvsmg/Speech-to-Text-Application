# AURA.transcript - Infinite Auto-Sync Watcher Engine
# This script monitors your workspace in real-time and automatically pushes changes to GitHub.

$targetPath = "d:\projects\Speech-to-Text Application"
$debounceSeconds = 10
$lastSyncTime = [DateTime]::MinValue

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   🎙️ AURA.transcript - AUTO-WATCHER ENGINE  " -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Watching: $targetPath" -ForegroundColor Gray
Write-Host " Auto-pushing changes after $debounceSeconds seconds of inactivity." -ForegroundColor Gray
Write-Host " Press [Ctrl+C] to stop the auto-watcher." -ForegroundColor DarkGray
Write-Host "=============================================" -ForegroundColor Cyan

# Define a function to execute the Git Push
function Trigger-GitSync {
    param ($eventFile)
    
    # Simple check to avoid double-triggering inside the debounce window
    $global:lastSyncTime = Get-Date
    
    Write-Host ""
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⚡ Change detected in: $(Split-Path $eventFile -Leaf)" -ForegroundColor Yellow
    Write-Host "Waiting $debounceSeconds seconds for write activity to settle..." -ForegroundColor Gray
    Start-Sleep -Seconds $debounceSeconds
    
    # Check if more events came in and updated the sync time
    $elapsed = ((Get-Date) - $global:lastSyncTime).TotalSeconds
    if ($elapsed -lt $debounceSeconds) {
        Write-Host "Debounced: Another change was made recently. Postponing push..." -ForegroundColor DarkGray
        return
    }

    # Verify if there are actual git changes
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No unstaged changes remaining. Skipping sync." -ForegroundColor Gray
        return
    }

    Write-Host "[Syncing] Staging and committing changes..." -ForegroundColor Magenta
    git add -A
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-Sync: Workspace updated at $timestamp"
    
    $branch = git branch --show-current
    Write-Host "[Syncing] Pushing changes to GitHub: '$branch'..." -ForegroundColor Magenta
    
    $pushResult = git push origin $branch 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub successfully updated!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Auto-push failed. Check network or repository status." -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor Red
    }
    Write-Host "=============================================" -ForegroundColor Cyan
}

# Create the File System Watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $targetPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Filter out common directories and temp files to avoid infinite loops
$excludePatterns = @(
    "\\.git\\",
    "\\node_modules\\",
    "\\.next\\",
    "\\__pycache__\\",
    "\\.venv\\",
    "\\.db",
    "\\.db-journal",
    "\\.db-wal",
    "\\.db-shm",
    "\\.log",
    "\\.tmp"
)

# Event handler for any file system change
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # Check if path should be excluded
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -match [Regex]::Escape($pattern) -or $path -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude) {
        Trigger-GitSync -eventFile $path
    }
}

# Bind events
$handlers = @()
$handlers += Register-ObjectEvent $watcher "Changed" -Action $action
$handlers += Register-ObjectEvent $watcher "Created" -Action $action
$handlers += Register-ObjectEvent $watcher "Deleted" -Action $action
$handlers += Register-ObjectEvent $watcher "Renamed" -Action $action

try {
    # Keep the script running to listen for events
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    # Clean up event handlers on exit
    Write-Host "Shutting down Auto-Watcher..." -ForegroundColor Yellow
    foreach ($handler in $handlers) {
        Unregister-Event -SourceIdentifier $handler.Name
    }
    $watcher.Dispose()
    Write-Host "Auto-Watcher stopped." -ForegroundColor Gray
}
