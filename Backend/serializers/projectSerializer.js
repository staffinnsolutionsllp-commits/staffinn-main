/**
 * Phase 2: Project DTO serializers.
 * Never expose DynamoDB internals (PK, SK, workerState, TTL, objectKeys).
 */
const { buildMediaUrl } = require('../services/projectMediaUrlService');

function resolveMediaUrls(media) {
  if (!media || !media.variants) return { thumbnailUrl: null, detailUrl: null, fullUrl: null };
  return {
    thumbnailUrl: buildMediaUrl(media.variants.card?.storageKey) || buildMediaUrl(media.variants.detail?.storageKey),
    detailUrl: buildMediaUrl(media.variants.detail?.storageKey),
    fullUrl: buildMediaUrl(media.variants.full?.storageKey)
  };
}

function ownerProjectDTO(project) {
  if (!project) return null;
  const coverUrls = resolveMediaUrls(project.coverMedia);
  return {
    projectId: project.projectId,
    slug: project.slug,
    title: project.title,
    shortDescription: project.shortDescription || '',
    detailedDescription: project.detailedDescription || '',
    projectType: project.projectType || null,
    roleOrContribution: project.roleOrContribution || '',
    technologies: project.technologies || [],
    coverMedia: project.coverMedia ? { ...ownerMediaDTO(project.coverMedia), ...coverUrls } : null,
    galleryMedia: (project.galleryMedia || []).map(m => {
      const urls = resolveMediaUrls(m);
      return { ...ownerMediaDTO(m), ...urls };
    }),
    videoUrl: project.videoUrl || null,
    liveUrl: project.liveUrl || null,
    repositoryUrl: project.repositoryUrl || null,
    showLiveUrl: project.showLiveUrl !== false,
    showRepositoryUrl: project.showRepositoryUrl !== false,
    showVideoUrl: project.showVideoUrl !== false,
    startDate: project.startDate || null,
    endDate: project.endDate || null,
    isOngoing: project.isOngoing || false,
    status: project.status,
    isFeatured: project.isFeatured || false,
    displayOrder: project.displayOrder || 0,
    version: project.version,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    publishedAt: project.publishedAt || null,
    archivedAt: project.archivedAt || null
  };
}

function ownerMediaDTO(media) {
  if (!media) return null;
  return {
    mediaId: media.mediaId,
    type: media.type || 'gallery',
    thumbnailUrl: media.thumbnailUrl || null,
    detailUrl: media.detailUrl || null,
    fullUrl: media.fullUrl || null,
    width: media.width || 0,
    height: media.height || 0,
    sizeBytes: media.sizeBytes || 0,
    displayOrder: media.displayOrder || 0,
    createdAt: media.createdAt
  };
}

function publicProjectCardDTO(project) {
  if (!project) return null;
  return {
    projectId: project.projectId,
    slug: project.slug,
    title: project.title,
    shortDescription: project.shortDescription || '',
    projectType: project.projectType || null,
    roleOrContribution: project.roleOrContribution || '',
    technologies: project.technologies || [],
    coverImageUrl: project.coverMedia?.thumbnailUrl || null,
    startDate: project.startDate || null,
    endDate: project.endDate || null,
    isOngoing: project.isOngoing || false,
    isFeatured: project.isFeatured || false,
    liveUrl: (project.showLiveUrl !== false && project.liveUrl) ? project.liveUrl : null,
    repositoryUrl: (project.showRepositoryUrl !== false && project.repositoryUrl) ? project.repositoryUrl : null
  };
}

function publicProjectDetailDTO(project) {
  if (!project) return null;
  return {
    projectId: project.projectId,
    slug: project.slug,
    title: project.title,
    shortDescription: project.shortDescription || '',
    detailedDescription: project.detailedDescription || '',
    projectType: project.projectType || null,
    roleOrContribution: project.roleOrContribution || '',
    technologies: project.technologies || [],
    coverImageUrl: project.coverMedia?.fullUrl || null,
    galleryImages: (project.galleryMedia || []).map(m => ({
      url: m.detailUrl || null, fullUrl: m.fullUrl || null, width: m.width, height: m.height
    })),
    videoEmbedUrl: (project.showVideoUrl !== false && project.videoUrl) ? buildVideoEmbed(project.videoUrl) : null,
    liveUrl: (project.showLiveUrl !== false && project.liveUrl) ? project.liveUrl : null,
    repositoryUrl: (project.showRepositoryUrl !== false && project.repositoryUrl) ? project.repositoryUrl : null,
    startDate: project.startDate || null,
    endDate: project.endDate || null,
    isOngoing: project.isOngoing || false,
    isFeatured: project.isFeatured || false
  };
}

function buildVideoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  const lm = url.match(/loom\.com\/share\/([a-f0-9-]+)/);
  if (lm) return `https://www.loom.com/embed/${lm[1]}`;
  return null;
}

function portfolioMetaDTO(meta) {
  if (!meta) return null;
  return {
    activeProjectCount: meta.activeProjectCount || 0,
    featuredPublishedCount: meta.featuredPublishedCount || 0,
    portfolioVersion: meta.version || 0
  };
}

module.exports = {
  ownerProjectDTO, ownerMediaDTO, publicProjectCardDTO,
  publicProjectDetailDTO, portfolioMetaDTO, buildVideoEmbed
};
