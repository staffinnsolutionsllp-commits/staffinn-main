/**
 * Phase 2: Media URL Service.
 * Converts internal storage keys to delivery URLs.
 * If STAFF_PROJECT_MEDIA_DOMAIN is set → uses CloudFront.
 * Otherwise falls back to S3 presigned-like direct URL (requires bucket read access).
 */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET = () => process.env.STAFF_PROJECT_MEDIA_BUCKET || 'staffinn-project-media';

function getMediaDomain() {
  return process.env.STAFF_PROJECT_MEDIA_DOMAIN || null;
}

function buildMediaUrl(storageKey) {
  if (!storageKey) return null;
  const domain = getMediaDomain();
  if (domain) {
    // CloudFront path
    const safePath = storageKey.replace(/[^a-zA-Z0-9/_.-]/g, '');
    return `https://${domain}/${safePath}`;
  }
  // Fallback: use S3 regional URL (works if bucket policy allows public read on projects/ prefix)
  const region = process.env.AWS_REGION || 'ap-south-1';
  const bucket = BUCKET();
  return `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
}

async function buildPresignedUrl(storageKey, expiresIn = 3600) {
  if (!storageKey) return null;
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET(), Key: storageKey });
    return await getSignedUrl(s3, command, { expiresIn });
  } catch (e) { return null; }
}

function mediaMetaToUrls(media) {
  if (!media || !media.variants) return { thumbnailUrl: null, detailUrl: null, fullUrl: null };
  return {
    thumbnailUrl: buildMediaUrl(media.variants.card?.storageKey || null),
    detailUrl: buildMediaUrl(media.variants.detail?.storageKey || null),
    fullUrl: buildMediaUrl(media.variants.full?.storageKey || null)
  };
}

module.exports = { buildMediaUrl, buildPresignedUrl, mediaMetaToUrls, getMediaDomain };
