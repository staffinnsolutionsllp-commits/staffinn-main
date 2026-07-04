/**
 * Campus Planner Model
 * Handles placement planner data for institutes
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const CAMPUS_PLANNERS_TABLE = process.env.CAMPUS_PLANNERS_TABLE || 'campus-drive-planners';

/**
 * Get planner for an institute (creates one if not exists)
 */
const getPlannerByInstitute = async (instituteId) => {
  try {
    const allPlanners = await dynamoService.scanItems(CAMPUS_PLANNERS_TABLE);
    const planner = allPlanners.find(p => p.instituteId === instituteId);
    return planner || null;
  } catch (error) {
    console.error('Get planner error:', error);
    throw error;
  }
};

/**
 * Save / update planner for an institute
 */
const savePlanner = async (instituteId, plannerData) => {
  try {
    const existing = await getPlannerByInstitute(instituteId);
    const timestamp = new Date().toISOString();

    const item = {
      plannerId: existing ? existing.plannerId : uuidv4(),
      instituteId,
      selectedDates: plannerData.selectedDates || [],
      dateRanges: plannerData.dateRanges || [],
      notes: plannerData.notes || '',
      updatedAt: timestamp,
      createdAt: existing ? existing.createdAt : timestamp
    };

    await dynamoService.putItem(CAMPUS_PLANNERS_TABLE, item);
    return { success: true, data: item };
  } catch (error) {
    console.error('Save planner error:', error);
    throw error;
  }
};

module.exports = { getPlannerByInstitute, savePlanner };
