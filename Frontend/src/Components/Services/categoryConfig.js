/**
 * Category-driven Service Configuration.
 * Defines allowed pricing models, package features, and service-specific fields
 * for each supported category. Extensible without modifying ServiceBuilder.
 */

export const CATEGORY_CONFIGS = {
  'Web Developer': {
    pricingModes: ['tiered', 'fixed', 'hourly', 'monthly', 'custom_quote'],
    packageFeatures: [
      { key: 'pages', label: 'Number of Pages', type: 'number' },
      { key: 'responsive', label: 'Responsive Design', type: 'boolean' },
      { key: 'admin', label: 'Admin Dashboard', type: 'boolean' },
      { key: 'ecommerce', label: 'E-commerce', type: 'boolean' },
      { key: 'auth', label: 'Authentication', type: 'boolean' },
      { key: 'database', label: 'Database', type: 'boolean' },
      { key: 'api', label: 'API Integration', type: 'boolean' },
      { key: 'payment', label: 'Payment Integration', type: 'boolean' },
      { key: 'seo', label: 'SEO Setup', type: 'boolean' },
      { key: 'hosting', label: 'Hosting Setup', type: 'boolean' },
      { key: 'deployment', label: 'Deployment', type: 'boolean' },
      { key: 'source', label: 'Source Code Delivery', type: 'boolean' },
      { key: 'support', label: 'Support (days)', type: 'number' },
    ],
    serviceFields: ['technologyStack', 'websiteType'],
  },
  'Software Developer': {
    pricingModes: ['tiered', 'fixed', 'hourly', 'monthly', 'custom_quote'],
    packageFeatures: [
      { key: 'features', label: 'Number of Features', type: 'number' },
      { key: 'platforms', label: 'Platforms', type: 'text' },
      { key: 'database', label: 'Database', type: 'boolean' },
      { key: 'api', label: 'API Development', type: 'boolean' },
      { key: 'testing', label: 'Testing', type: 'boolean' },
      { key: 'deployment', label: 'Deployment', type: 'boolean' },
      { key: 'source', label: 'Source Code', type: 'boolean' },
      { key: 'support', label: 'Support (days)', type: 'number' },
    ],
    serviceFields: ['technologyStack'],
  },
  'Photographer': {
    pricingModes: ['fixed', 'hourly', 'per_session', 'per_item', 'custom_quote'],
    packageFeatures: [
      { key: 'products', label: 'Number of Products', type: 'number' },
      { key: 'finalImages', label: 'Final Images', type: 'number' },
      { key: 'retouching', label: 'Retouching', type: 'boolean' },
      { key: 'bgRemoval', label: 'Background Removal', type: 'boolean' },
      { key: 'rawFiles', label: 'Raw Files', type: 'boolean' },
      { key: 'studio', label: 'Studio Setup', type: 'boolean' },
      { key: 'models', label: 'Models Included', type: 'boolean' },
      { key: 'travel', label: 'Travel Included', type: 'boolean' },
      { key: 'revisions', label: 'Revisions', type: 'number' },
    ],
    serviceFields: ['photographyType', 'location'],
  },
  'Carpenter': {
    pricingModes: ['hourly', 'daily', 'per_visit', 'fixed', 'custom_quote'],
    packageFeatures: [
      { key: 'inspection', label: 'Inspection Visit', type: 'boolean' },
      { key: 'labourHours', label: 'Labour Hours', type: 'number' },
      { key: 'workers', label: 'Number of Workers', type: 'number' },
      { key: 'tools', label: 'Tools Included', type: 'boolean' },
      { key: 'materials', label: 'Materials Included', type: 'boolean' },
      { key: 'travelRadius', label: 'Travel Radius (km)', type: 'number' },
      { key: 'emergency', label: 'Emergency Service', type: 'boolean' },
      { key: 'warranty', label: 'Work Warranty (days)', type: 'number' },
    ],
    serviceFields: ['workType', 'furnitureType', 'materialExpertise'],
  },
  'Online Tutor / Home Tutor': {
    pricingModes: ['hourly', 'per_session', 'monthly', 'custom_quote'],
    packageFeatures: [
      { key: 'sessionDuration', label: 'Session Duration (min)', type: 'number' },
      { key: 'classes', label: 'Number of Classes', type: 'number' },
      { key: 'individual', label: 'Individual/Group', type: 'text' },
      { key: 'notes', label: 'Study Notes', type: 'boolean' },
      { key: 'tests', label: 'Practice Tests', type: 'boolean' },
      { key: 'doubt', label: 'Doubt Sessions', type: 'boolean' },
      { key: 'demo', label: 'Demo Class', type: 'boolean' },
      { key: 'progress', label: 'Progress Report', type: 'boolean' },
    ],
    serviceFields: ['subject', 'educationLevel'],
  },
  'Graphic Designer': {
    pricingModes: ['tiered', 'fixed', 'per_item', 'hourly', 'custom_quote'],
    packageFeatures: [
      { key: 'concepts', label: 'Design Concepts', type: 'number' },
      { key: 'revisions', label: 'Revisions', type: 'number' },
      { key: 'sourceFiles', label: 'Source Files', type: 'boolean' },
      { key: 'printReady', label: 'Print Ready', type: 'boolean' },
      { key: 'socialMedia', label: 'Social Media Sizes', type: 'boolean' },
      { key: 'mockup', label: '3D Mockup', type: 'boolean' },
    ],
    serviceFields: ['designType'],
  },
};

/**
 * Get configuration for a specific category.
 * Returns null if no specific configuration exists (uses defaults).
 */
export function getCategoryConfig(category) {
  return CATEGORY_CONFIGS[category] || null;
}

/**
 * Get allowed pricing modes for a category.
 * Returns all modes if no specific config exists.
 */
export function getAllowedPricingModes(category) {
  const config = getCategoryConfig(category);
  return config?.pricingModes || null; // null means all allowed
}

/**
 * Get package feature definitions for a category.
 */
export function getPackageFeatures(category) {
  const config = getCategoryConfig(category);
  return config?.packageFeatures || [];
}
