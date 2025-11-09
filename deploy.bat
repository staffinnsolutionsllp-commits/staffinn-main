@echo off
echo ========================================
echo FRONTEND DEPLOYMENT
echo ========================================
cd Frontend
echo Building Frontend...
npm run build
echo Uploading to S3...
aws s3 sync dist/ s3://staffinn-frontend-app --delete
echo Clearing CloudFront cache...
aws cloudfront create-invalidation --distribution-id E2JUUE5SZS81E0 --paths "/*"
cd ..

echo ========================================
echo MASTER ADMIN DEPLOYMENT  
echo ========================================
cd MasterAdminPanel
echo Building Master Admin...
npm run build
echo Uploading to S3...
aws s3 sync dist/ s3://staffinn-master-admin --delete
echo Clearing CloudFront cache...
aws cloudfront create-invalidation --distribution-id E3O2FX44UWSJU4 --paths "/*"
cd ..

echo ========================================
echo NEWS ADMIN DEPLOYMENT
echo ========================================
cd NewsAdminPanel
echo Building News Admin...
npm run build
echo Uploading to S3...
aws s3 sync dist/ s3://staffinn-news-admin --delete
echo Clearing CloudFront cache...
aws cloudfront create-invalidation --distribution-id E1B0K634SBYQQ1 --paths "/*"

echo ========================================
echo ALL DEPLOYMENTS COMPLETE!
echo ========================================
pause