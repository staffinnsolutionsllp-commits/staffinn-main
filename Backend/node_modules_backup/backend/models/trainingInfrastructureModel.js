const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'MIS-Training-Infrastructure';

class TrainingInfrastructureModel {
    static async create(data) {
        const id = uuidv4();
        const timestamp = new Date().toISOString();

        const item = {
            TrainingInfrastructureId: id,
            id: id,
            instituteId: data.instituteId,
            trainingCenterId: data.trainingCenterId,
            trainingCenterName: data.trainingCenterName,
            totalArea: data.totalArea,
            totalTrainingHours: data.totalTrainingHours,
            workingHours: data.workingHours,
            totalClassrooms: data.totalClassrooms,
            totalLabs: data.totalLabs,
            washroomsMale: data.washroomsMale,
            washroomsFemale: data.washroomsFemale,
            washroomsDifferentlyAbled: data.washroomsDifferentlyAbled,
            drinkingWaterFacilities: data.drinkingWaterFacilities,
            firstAidAvailability: data.firstAidAvailability,
            fireFightingEquipment: data.fireFightingEquipment,
            photos: data.photos || [],
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        });

        await docClient.send(command);
        return item;
    }

    static async getAll() {
        try {
            const command = new ScanCommand({
                TableName: TABLE_NAME
            });

            const response = await docClient.send(command);
            const items = response.Items || [];
            
            return items.map(item => ({
                ...item,
                id: item.TrainingInfrastructureId || item.id
            }));
        } catch (error) {
            console.error('Error getting training infrastructure:', error);
            return [];
        }
    }

    static async getById(id) {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                TrainingInfrastructureId: id
            }
        });

        const response = await docClient.send(command);
        return response.Item;
    }

    static async getByInstitute(instituteId) {
        try {
            const command = new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'instituteId = :instituteId',
                ExpressionAttributeValues: {
                    ':instituteId': instituteId
                }
            });

            const response = await docClient.send(command);
            const items = response.Items || [];
            
            return items.map(item => ({
                ...item,
                id: item.TrainingInfrastructureId || item.id
            }));
        } catch (error) {
            console.error('Error getting training infrastructure by institute:', error);
            return [];
        }
    }

    static async update(id, data) {
        const timestamp = new Date().toISOString();
        const existing = await this.getById(id);

        const item = {
            TrainingInfrastructureId: id,
            id: id,
            instituteId: existing?.instituteId || data.instituteId,
            trainingCenterId: data.trainingCenterId,
            trainingCenterName: data.trainingCenterName,
            totalArea: data.totalArea,
            totalTrainingHours: data.totalTrainingHours,
            workingHours: data.workingHours,
            totalClassrooms: data.totalClassrooms,
            totalLabs: data.totalLabs,
            washroomsMale: data.washroomsMale,
            washroomsFemale: data.washroomsFemale,
            washroomsDifferentlyAbled: data.washroomsDifferentlyAbled,
            drinkingWaterFacilities: data.drinkingWaterFacilities,
            firstAidAvailability: data.firstAidAvailability,
            fireFightingEquipment: data.fireFightingEquipment,
            photos: data.photos !== undefined ? data.photos : (existing?.photos || []),
            createdAt: existing?.createdAt || timestamp,
            updatedAt: timestamp
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        });

        await docClient.send(command);
        return item;
    }

    static async delete(id) {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                TrainingInfrastructureId: id
            }
        });

        await docClient.send(command);
        return true;
    }
}

module.exports = TrainingInfrastructureModel;
