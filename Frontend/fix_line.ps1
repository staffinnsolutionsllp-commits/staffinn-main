$filePath = "C:\Users\hp\Downloads\Staffinn-main\Staffinn-main\Frontend\src\Components\Dashboard\RecruiterDashboard.jsx"
$content = Get-Content $filePath
$newLine = '                            <p>📢 <strong>Note:</strong> Changes will only appear on your public profile after clicking "Update Profile & Go Live" button.</p>'
$content[2973] = $newLine
$content | Set-Content $filePath
Write-Host "Fixed line 2974 in RecruiterDashboard.jsx"