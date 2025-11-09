@echo off
echo Deploying News Admin...
cd NewsAdminPanel
npm run build
aws s3 sync dist/ s3://staffinn-news-admin --delete
aws cloudfront create-invalidation --distribution-id E1B0K634SBYQQ1 --paths "/*"
echo News Admin deployment complete!
pause