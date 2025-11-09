@echo off
echo Deploying Master Admin...
cd MasterAdminPanel
npm run build
aws s3 sync dist/ s3://staffinn-master-admin --delete
aws cloudfront create-invalidation --distribution-id E3O2FX44UWSJU4 --paths "/*"
echo Master Admin deployment complete!
pause