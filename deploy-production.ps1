# ===================================================================
#  STAFFINN PRODUCTION DEPLOYMENT - PowerShell Script
#  Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ===================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   STAFFINN PRODUCTION DEPLOYMENT" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "[OK] AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS CLI not installed!" -ForegroundColor Red
    Write-Host "Install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# CloudFront Distribution IDs (Update these with actual IDs)
$CLOUDFRONT_IDS = @{
    "Frontend" = "E_YOUR_FRONTEND_DISTRIBUTION_ID"
    "EmployeePortal" = "E_YOUR_HRMS_DISTRIBUTION_ID"
    "MasterAdmin" = "E_YOUR_ADMIN_DISTRIBUTION_ID"
    "NewsAdmin" = "E_YOUR_NEWS_DISTRIBUTION_ID"
}

# S3 Buckets
$S3_BUCKETS = @{
    "Frontend" = "staffinn.com"
    "EmployeePortal" = "hrms.staffinn.com"
    "MasterAdmin" = "admin.staffinn.com"
    "NewsAdmin" = "news-admin.staffinn.com"
}

# Function to deploy a component
function Deploy-Component {
    param(
        [string]$Name,
        [string]$Folder,
        [string]$Bucket,
        [string]$DistributionId
    )
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   DEPLOYING $Name" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if dist folder exists
    $distPath = Join-Path $Folder "dist"
    if (-not (Test-Path $distPath)) {
        Write-Host "[ERROR] $Name dist folder not found at: $distPath" -ForegroundColor Red
        Write-Host "Run 'npm run build' in $Folder first!" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Uploading $Name to S3: $Bucket..." -ForegroundColor Yellow
    
    try {
        Push-Location $Folder
        aws s3 sync dist/ "s3://$Bucket" --delete --profile default
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] S3 upload successful!" -ForegroundColor Green
            
            # Invalidate CloudFront cache
            if ($DistributionId -ne "E_YOUR_*") {
                Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
                aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" --profile default
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] CloudFront invalidation triggered!" -ForegroundColor Green
                } else {
                    Write-Host "[WARNING] CloudFront invalidation failed!" -ForegroundColor Yellow
                }
            } else {
                Write-Host "[SKIP] CloudFront Distribution ID not configured" -ForegroundColor Yellow
                Write-Host "       Update CLOUDFRONT_IDS in script with actual IDs" -ForegroundColor Gray
            }
            
            Pop-Location
            return $true
        } else {
            Write-Host "[ERROR] S3 upload failed!" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } catch {
        Write-Host "[ERROR] Deployment failed: $_" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

# Deploy all components
$results = @{}

# 1. Frontend
$results["Frontend"] = Deploy-Component -Name "FRONTEND (staffinn.com)" -Folder "Frontend" -Bucket $S3_BUCKETS["Frontend"] -DistributionId $CLOUDFRONT_IDS["Frontend"]

# 2. Employee Portal
$results["EmployeePortal"] = Deploy-Component -Name "EMPLOYEE PORTAL (hrms.staffinn.com)" -Folder "EmployeePortal" -Bucket $S3_BUCKETS["EmployeePortal"] -DistributionId $CLOUDFRONT_IDS["EmployeePortal"]

# 3. Master Admin
$results["MasterAdmin"] = Deploy-Component -Name "MASTER ADMIN (admin.staffinn.com)" -Folder "MasterAdminPanel" -Bucket $S3_BUCKETS["MasterAdmin"] -DistributionId $CLOUDFRONT_IDS["MasterAdmin"]

# 4. News Admin
$results["NewsAdmin"] = Deploy-Component -Name "NEWS ADMIN (news-admin.staffinn.com)" -Folder "NewsAdminPanel" -Bucket $S3_BUCKETS["NewsAdmin"] -DistributionId $CLOUDFRONT_IDS["NewsAdmin"]

# ===================================================================
# BACKEND DEPLOYMENT INSTRUCTIONS
# ===================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   BACKEND DEPLOYMENT (EC2)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend deployment requires SSH access to EC2." -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command (replace YOUR_EC2_IP and path to .pem key):" -ForegroundColor White
Write-Host ""
Write-Host 'ssh -i "path/to/staffinn-key.pem" ubuntu@YOUR_EC2_IP "cd /home/ubuntu/staffinn-backend && git pull origin main && npm install --production && pm2 restart staffinn-backend && pm2 save"' -ForegroundColor Green
Write-Host ""

# ===================================================================
# DEPLOYMENT SUMMARY
# ===================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT SUMMARY" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($component in $results.Keys) {
    $status = if ($results[$component]) { "[OK]" } else { "[FAILED]" }
    $color = if ($results[$component]) { "Green" } else { "Red" }
    
    $url = switch ($component) {
        "Frontend" { "https://staffinn.com" }
        "EmployeePortal" { "https://hrms.staffinn.com" }
        "MasterAdmin" { "https://admin.staffinn.com" }
        "NewsAdmin" { "https://news-admin.staffinn.com" }
    }
    
    Write-Host "$status $component" -ForegroundColor $color -NoNewline
    Write-Host " - $url" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   POST-DEPLOYMENT TESTING" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Frontend:       https://staffinn.com" -ForegroundColor White
Write-Host "2. HRMS Portal:    https://hrms.staffinn.com" -ForegroundColor White
Write-Host "   ** Test 'Forgot Password' feature! **" -ForegroundColor Magenta
Write-Host "3. Master Admin:   https://admin.staffinn.com" -ForegroundColor White
Write-Host "4. News Admin:     https://news-admin.staffinn.com" -ForegroundColor White
Write-Host "5. Backend API:    https://api.staffinn.com/health" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if any deployment failed
$failedCount = ($results.Values | Where-Object { -not $_ }).Count
if ($failedCount -gt 0) {
    Write-Host "[WARNING] $failedCount component(s) failed to deploy!" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "[SUCCESS] All components deployed successfully!" -ForegroundColor Green
}
