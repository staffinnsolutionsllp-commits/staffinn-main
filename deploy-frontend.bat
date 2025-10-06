@echo off
echo Deploying Frontend...
cd Frontend
npm run build
aws s3 sync dist/ s3://staffinn-frontend-app --delete
aws cloudfront create-invalidation --distribution-id E2JUUE5SZS81E0 --paths "/*"
echo Frontend deployment complete!
pause