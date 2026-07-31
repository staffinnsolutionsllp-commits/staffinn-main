/**
 * Phase 2F: Staff Service Model
 * DynamoDB data-access layer for staffinn-staff-services table.
 * Handles: Service CRUD, Packages, FAQs, Requirements, Status lifecycle.
 */
const { v4: uuidv4 } = require('uuid');
const { PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../services/dynamoService');

const TABLE = () => process.env.STAFF_SERVICES_TABLE || 'staffinn-staff-services';

const SERVICE_STATUSES = ['draft', 'active', 'paused', 'archived'];
const PRICING_MODES = ['fixed', 'tiered', 'hourly', 'daily', 'per_visit', 'per_session', 'per_item', 'monthly', 'custom_quote'];
const WORK_MODES = ['remote', 'on_site', 'hybrid'];

// ═══════════════════════════════════════════════════════════════════════
// SERVICE CRUD
// ═══════════════════════════════════════════════════════════════════════

async function createService(userId, data) {
  const serviceId = uuidv4();
  const now = new Date().toISOString();
  const slug = generateServiceSlug(data.title, serviceId);

  const item = {
    PK: `USER#${userId}`,
    SK: `SERVICE#${serviceId}`,
    entityType: 'SERVICE',
    serviceId,
    userId,
    slug,
    title: data.title,
    shortDescription: data.shortDescription || '',
    detailedDescription: data.detailedDescription || '',
    sector: data.sector || null,
    category: data.category || null,
    subcategory: data.subcategory || null,
    workMode: data.workMode || 'remote',
    pricingMode: data.pricingMode || 'fixed',
    startingPrice: data.startingPrice || null,
    currency: data.currency || 'INR',
    customQuoteEnabled: data.customQuoteEnabled || false,
    deliveryTime: data.deliveryTime || null,
    deliveryUnit: data.deliveryUnit || 'days',
    location: data.location || null,
    serviceRadius: data.serviceRadius || null,
    tags: data.tags || [],
    packages: [],
    faqs: [],
    requirements: [],
    coverMediaUrl: null,
    galleryMediaUrls: [],
    status: 'draft',
    acceptingOrders: true,
    featured: false,
    impressions: 0,
    clicks: 0,
    orderCount: 0,
    rating: 0,
    reviewCount: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    archivedAt: null
  };

  await docClient.send(new PutCommand({ TableName: TABLE(), Item: item }));
  return item;
}

async function getServiceById(userId, serviceId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE(),
    Key: { PK: `USER#${userId}`, SK: `SERVICE#${serviceId}` }
  }));
  return result.Item || null;
}

async function getServiceBySlug(slug) {
  // Query GSI slug-index
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE(),
    IndexName: 'slug-index',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: { ':slug': slug }
  }));
  return (result.Items && result.Items[0]) || null;
}

async function listServicesByOwner(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE(),
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':prefix': 'SERVICE#' }
  }));
  const services = (result.Items || []).filter(i => i.entityType === 'SERVICE');
  return services.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

async function listPublicServices(userId) {
  const all = await listServicesByOwner(userId);
  return all.filter(s => s.status === 'active');
}

async function updateService(userId, serviceId, fields, expectedVersion) {
  const now = new Date().toISOString();
  const updateExpressions = ['updatedAt = :now', '#ver = #ver + :one'];
  const attrNames = { '#ver': 'version' };
  const attrValues = { ':now': now, ':one': 1, ':expectedVersion': expectedVersion };

  Object.entries(fields).forEach(([key, value], i) => {
    const nameKey = `#f${i}`;
    const valKey = `:v${i}`;
    updateExpressions.push(`${nameKey} = ${valKey}`);
    attrNames[nameKey] = key;
    attrValues[valKey] = value;
  });

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE(),
      Key: { PK: `USER#${userId}`, SK: `SERVICE#${serviceId}` },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ConditionExpression: '#ver = :expectedVersion',
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      const error = new Error('Version conflict');
      error.code = 'VERSION_CONFLICT';
      throw error;
    }
    throw err;
  }
}

async function publishService(userId, serviceId, expectedVersion) {
  return updateService(userId, serviceId, { status: 'active', publishedAt: new Date().toISOString() }, expectedVersion);
}

async function pauseService(userId, serviceId, expectedVersion) {
  return updateService(userId, serviceId, { status: 'paused' }, expectedVersion);
}

async function reactivateService(userId, serviceId, expectedVersion) {
  return updateService(userId, serviceId, { status: 'active' }, expectedVersion);
}

async function archiveService(userId, serviceId, expectedVersion) {
  return updateService(userId, serviceId, { status: 'archived', archivedAt: new Date().toISOString() }, expectedVersion);
}

async function restoreService(userId, serviceId, expectedVersion) {
  return updateService(userId, serviceId, { status: 'draft', archivedAt: null }, expectedVersion);
}

async function deleteService(userId, serviceId) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE(),
    Key: { PK: `USER#${userId}`, SK: `SERVICE#${serviceId}` }
  }));
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// PACKAGES
// ═══════════════════════════════════════════════════════════════════════

async function updatePackages(userId, serviceId, packages, expectedVersion) {
  return updateService(userId, serviceId, { packages }, expectedVersion);
}

// ═══════════════════════════════════════════════════════════════════════
// FAQs
// ═══════════════════════════════════════════════════════════════════════

async function updateFaqs(userId, serviceId, faqs, expectedVersion) {
  return updateService(userId, serviceId, { faqs }, expectedVersion);
}

// ═══════════════════════════════════════════════════════════════════════
// REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════

async function updateRequirements(userId, serviceId, requirements, expectedVersion) {
  return updateService(userId, serviceId, { requirements }, expectedVersion);
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function generateServiceSlug(title, serviceId) {
  let slug = (title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  slug = slug.replace(/[^\x00-\x7F]/g, '').toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) slug = 'service';
  return `${slug}-${serviceId.substring(0, 8)}`;
}

function serviceOwnerDTO(service) {
  if (!service) return null;
  return {
    serviceId: service.serviceId,
    slug: service.slug,
    title: service.title,
    shortDescription: service.shortDescription,
    detailedDescription: service.detailedDescription,
    sector: service.sector,
    category: service.category,
    subcategory: service.subcategory,
    workMode: service.workMode,
    pricingMode: service.pricingMode,
    startingPrice: service.startingPrice,
    currency: service.currency,
    customQuoteEnabled: service.customQuoteEnabled,
    deliveryTime: service.deliveryTime,
    deliveryUnit: service.deliveryUnit,
    location: service.location,
    serviceRadius: service.serviceRadius,
    tags: service.tags || [],
    packages: service.packages || [],
    faqs: service.faqs || [],
    requirements: service.requirements || [],
    addons: service.addons || [],
    availability: service.availability || null,
    seo: service.seo || null,
    coverMediaUrl: service.coverMediaUrl,
    galleryMediaUrls: service.galleryMediaUrls || [],
    status: service.status,
    acceptingOrders: service.acceptingOrders,
    featured: service.featured,
    impressions: service.impressions || 0,
    clicks: service.clicks || 0,
    orderCount: service.orderCount || 0,
    rating: service.rating || 0,
    reviewCount: service.reviewCount || 0,
    version: service.version,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    publishedAt: service.publishedAt
  };
}

function servicePublicDTO(service) {
  if (!service) return null;
  return {
    serviceId: service.serviceId,
    slug: service.slug,
    title: service.title,
    shortDescription: service.shortDescription,
    detailedDescription: service.detailedDescription,
    sector: service.sector,
    category: service.category,
    subcategory: service.subcategory,
    workMode: service.workMode,
    pricingMode: service.pricingMode,
    startingPrice: service.startingPrice,
    currency: service.currency,
    customQuoteEnabled: service.customQuoteEnabled,
    deliveryTime: service.deliveryTime,
    deliveryUnit: service.deliveryUnit,
    location: service.location,
    tags: service.tags || [],
    packages: (service.packages || []).filter(p => p.active !== false),
    faqs: (service.faqs || []).filter(f => f.active !== false),
    coverMediaUrl: service.coverMediaUrl,
    galleryMediaUrls: service.galleryMediaUrls || [],
    acceptingOrders: service.acceptingOrders,
    rating: service.rating || 0,
    reviewCount: service.reviewCount || 0
  };
}

function serviceCardDTO(service) {
  if (!service) return null;
  return {
    serviceId: service.serviceId,
    slug: service.slug,
    title: service.title,
    shortDescription: service.shortDescription,
    category: service.category,
    workMode: service.workMode,
    pricingMode: service.pricingMode,
    startingPrice: service.startingPrice,
    currency: service.currency,
    deliveryTime: service.deliveryTime,
    deliveryUnit: service.deliveryUnit,
    coverMediaUrl: service.coverMediaUrl,
    rating: service.rating || 0,
    reviewCount: service.reviewCount || 0
  };
}

module.exports = {
  createService, getServiceById, getServiceBySlug,
  listServicesByOwner, listPublicServices, updateService,
  publishService, pauseService, reactivateService,
  archiveService, restoreService, deleteService,
  updatePackages, updateFaqs, updateRequirements,
  serviceOwnerDTO, servicePublicDTO, serviceCardDTO,
  SERVICE_STATUSES, PRICING_MODES, WORK_MODES, TABLE
};
