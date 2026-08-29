# ==============================================================================
# Automated Export & Sync Script to d:\projects\porulaxiomv1
# ==============================================================================

$Source = "d:\projects\RESUME BUILDING\PorulAxiom"
$Destination = "d:\projects\porulaxiomv1"

Write-Host "Syncing PorulAxiom v1 codebase from $Source to $Destination..." -ForegroundColor Cyan

if (-not (Test-Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

# Exclude temporary and heavy build folders
$ExcludeDirs = @(".venv", ".next", "node_modules", "__pycache__", ".git", ".pytest_cache")

# Copy items recursively
robocopy $Source $Destination /E /XD .venv .next node_modules __pycache__ .git .pytest_cache /XF *.pyc *.log /NP /NDL /NFL

Write-Host "PorulAxiom v1 Prototype exported successfully to $Destination!" -ForegroundColor Green
