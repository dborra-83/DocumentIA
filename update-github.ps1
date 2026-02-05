# Update GitHub Repository with Latest Changes
# This script commits and pushes all changes to GitHub

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "Update: Latest improvements and production deployment setup",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GitHub Repository Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git not found. Please install Git." -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "ERROR: Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain

if (!$status) {
    Write-Host "No changes to commit." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Changes to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Confirm
if (!$Force) {
    $confirmation = Read-Host "Do you want to commit and push these changes? (yes/no)"
    if ($confirmation -ne 'yes') {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Add all changes
Write-Host ""
Write-Host "Adding changes..." -ForegroundColor Yellow
git add .

# Check if there are files to commit
$staged = git diff --cached --name-only
if (!$staged) {
    Write-Host "No changes staged for commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "Changes staged successfully" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Changes committed successfully" -ForegroundColor Green

# Get current branch
$currentBranch = git branch --show-current

if ($currentBranch -ne $Branch) {
    Write-Host ""
    Write-Host "WARNING: Current branch is '$currentBranch', but you specified '$Branch'" -ForegroundColor Yellow
    $switchBranch = Read-Host "Do you want to switch to '$Branch'? (yes/no)"
    
    if ($switchBranch -eq 'yes') {
        git checkout $Branch
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to switch to branch '$Branch'" -ForegroundColor Red
            exit 1
        }
    } else {
        $Branch = $currentBranch
    }
}

# Push to remote
Write-Host ""
Write-Host "Pushing to GitHub ($Branch)..." -ForegroundColor Yellow

# Check if remote exists
$remotes = git remote
if (!$remotes) {
    Write-Host "ERROR: No remote repository configured." -ForegroundColor Red
    Write-Host "Add a remote with: git remote add origin <repository-url>" -ForegroundColor Yellow
    exit 1
}

# Push
git push origin $Branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check your GitHub credentials" -ForegroundColor White
    Write-Host "2. Ensure you have push access to the repository" -ForegroundColor White
    Write-Host "3. Try: git push -u origin $Branch" -ForegroundColor White
    exit 1
}

Write-Host "Changes pushed to GitHub successfully" -ForegroundColor Green

# Get remote URL
$remoteUrl = git config --get remote.origin.url
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: $remoteUrl" -ForegroundColor Cyan
Write-Host "Branch: $Branch" -ForegroundColor Cyan
Write-Host "Commit: $CommitMessage" -ForegroundColor Cyan
Write-Host ""

# Show last commit
Write-Host "Last commit:" -ForegroundColor Yellow
git log -1 --oneline
Write-Host ""
