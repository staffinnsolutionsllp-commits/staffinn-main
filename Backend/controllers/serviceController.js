/**
 * Phase 2F: Staff Service Controller
 * Handles service CRUD, lifecycle, packages, and public access.
 */
const sm = require('../models/serviceModel');
const staffModel = require('../models/staffModel');

// ─── Feature Flag Guard ───────────────────────────────────────────────
function serviceFeatureGuard(req, res, next) {
  if (process.env.STAFF_SERVICES_ENABLED !== 'true') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
}

// ─── Owner Routes ─────────────────────────────────────────────────────

const createService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { title, shortDescription, sector, category, workMode, pricingMode, startingPrice, currency, deliveryTime, deliveryUnit, tags } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    if (title.trim().length > 150) return res.status(400).json({ success: false, message: 'Title max 150 characters' });

    const service = await sm.createService(req.user.userId, {
      title: title.trim(), shortDescription: shortDescription?.trim() || '',
      sector, category, workMode, pricingMode, startingPrice, currency,
      deliveryTime, deliveryUnit, tags: tags || []
    });
    res.status(201).json({ success: true, data: sm.serviceOwnerDTO(service) });
  } catch (err) {
    console.error('Create service error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

const getMyServices = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const services = await sm.listServicesByOwner(req.user.userId);
    const stats = {
      total: services.length,
      active: services.filter(s => s.status === 'active').length,
      draft: services.filter(s => s.status === 'draft').length,
      paused: services.filter(s => s.status === 'paused').length,
      archived: services.filter(s => s.status === 'archived').length
    };
    res.status(200).json({ success: true, data: { services: services.map(sm.serviceOwnerDTO), ...stats } });
  } catch (err) {
    console.error('Get services error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load services' });
  }
};

const getMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const service = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!service || service.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(service) });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to load service' }); }
};

const updateMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, ...fields } = req.body;
    if (!version || version < 1) return res.status(400).json({ success: false, message: 'Valid version required' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });

    // Allowlist
    const allowed = ['title', 'shortDescription', 'detailedDescription', 'sector', 'category', 'subcategory', 'workMode', 'pricingMode', 'startingPrice', 'currency', 'customQuoteEnabled', 'deliveryTime', 'deliveryUnit', 'location', 'serviceRadius', 'tags', 'acceptingOrders', 'coverMediaUrl', 'galleryMediaUrls', 'addons', 'requirements', 'availability', 'seo'];
    const safe = {};
    for (const key of allowed) { if (fields[key] !== undefined) safe[key] = fields[key]; }
    if (Object.keys(safe).length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const updated = await sm.updateService(req.user.userId, req.params.serviceId, safe, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Service was updated elsewhere' });
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

const publishMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version } = req.body;
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    if (existing.status !== 'draft' && existing.status !== 'paused') return res.status(422).json({ success: false, message: 'Can only publish from draft or paused' });
    const updated = await sm.publishService(req.user.userId, req.params.serviceId, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to publish service' });
  }
};

const pauseMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version } = req.body;
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.pauseService(req.user.userId, req.params.serviceId, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to pause service' });
  }
};

const reactivateMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version } = req.body;
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.reactivateService(req.user.userId, req.params.serviceId, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to reactivate service' });
  }
};

const archiveMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version } = req.body;
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.archiveService(req.user.userId, req.params.serviceId, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to archive service' });
  }
};

const deleteMyService = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    if (existing.status !== 'archived') return res.status(422).json({ success: false, message: 'Archive before deleting' });
    await sm.deleteService(req.user.userId, req.params.serviceId);
    res.status(200).json({ success: true, message: 'Service deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to delete service' }); }
};

const updateMyServicePackages = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, packages } = req.body;
    if (!Array.isArray(packages)) return res.status(400).json({ success: false, message: 'Packages must be an array' });
    if (packages.length > 3) return res.status(400).json({ success: false, message: 'Maximum 3 packages' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.updatePackages(req.user.userId, req.params.serviceId, packages, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to update packages' });
  }
};

const updateMyServiceFaqs = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, faqs } = req.body;
    if (!Array.isArray(faqs)) return res.status(400).json({ success: false, message: 'FAQs must be an array' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.updateFaqs(req.user.userId, req.params.serviceId, faqs, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to update FAQs' });
  }
};

const updateMyServiceAddons = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, addons } = req.body;
    if (!Array.isArray(addons)) return res.status(400).json({ success: false, message: 'Addons must be an array' });
    if (addons.length > 10) return res.status(400).json({ success: false, message: 'Maximum 10 add-ons' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.updateService(req.user.userId, req.params.serviceId, { addons }, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to update add-ons' });
  }
};

const updateMyServiceRequirements = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, requirements } = req.body;
    if (!Array.isArray(requirements)) return res.status(400).json({ success: false, message: 'Requirements must be an array' });
    if (requirements.length > 20) return res.status(400).json({ success: false, message: 'Maximum 20 requirements' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.updateRequirements(req.user.userId, req.params.serviceId, requirements, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to update requirements' });
  }
};

const updateMyServiceAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
    const { version, availability } = req.body;
    if (!availability || typeof availability !== 'object') return res.status(400).json({ success: false, message: 'Availability object required' });
    const existing = await sm.getServiceById(req.user.userId, req.params.serviceId);
    if (!existing || existing.userId !== req.user.userId) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await sm.updateService(req.user.userId, req.params.serviceId, { availability }, version);
    res.status(200).json({ success: true, data: sm.serviceOwnerDTO(updated) });
  } catch (err) {
    if (err.code === 'VERSION_CONFLICT') return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', message: 'Version conflict' });
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

// ─── Public Routes ────────────────────────────────────────────────────

const getPublicServices = async (req, res) => {
  try {
    const { profileSlug } = req.params;
    const staffProfile = await staffModel.getStaffProfileBySlug(profileSlug);
    if (!staffProfile) return res.status(404).json({ success: false, message: 'Not found' });
    const services = await sm.listPublicServices(staffProfile.userId);
    res.status(200).json({ success: true, data: { services: services.map(sm.serviceCardDTO), total: services.length } });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to load services' }); }
};

const getPublicServiceDetail = async (req, res) => {
  try {
    const service = await sm.getServiceBySlug(req.params.serviceSlug);
    if (!service || service.status !== 'active') return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: sm.servicePublicDTO(service) });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to load service' }); }
};

module.exports = {
  serviceFeatureGuard,
  createService, getMyServices, getMyService, updateMyService,
  publishMyService, pauseMyService, reactivateMyService,
  archiveMyService, deleteMyService,
  updateMyServicePackages, updateMyServiceFaqs,
  updateMyServiceAddons, updateMyServiceRequirements, updateMyServiceAvailability,
  getPublicServices, getPublicServiceDetail
};
