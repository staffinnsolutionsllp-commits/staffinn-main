#!/bin/bash

# Deploy Frontend to S3
echo "Deploying Frontend..."
aws s3 sync Frontend/dist/ s3://staffinn-frontend-app --delete
aws cloudfront create-invalidation --distribution-id E1234567890123 --paths "/*"

# Deploy Master Admin to S3  
echo "Deploying Master Admin..."
aws s3 sync MasterAdminPanel/dist/ s3://staffinn-master-admin --delete
aws cloudfront create-invalidation --distribution-id E1234567890124 --paths "/*"

# Deploy News Admin to S3
echo "Deploying News Admin..."
aws s3 sync NewsAdminPanel/dist/ s3://staffinn-news-admin --delete
aws cloudfront create-invalidation --distribution-id E1234567890125 --paths "/*"

echo "All deployments completed!"