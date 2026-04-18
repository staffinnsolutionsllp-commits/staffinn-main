const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'MisTrainingCenterForm';

class TrainingCenterModel {
    static async create(trainingCenterData) {
        const trainingCenterId = uuidv4();
        const timestamp = new Date().toISOString();

        const item = {
            TrainingCenterFormId: trainingCenterId,
            id: trainingCenterId,
            instituteId: trainingCenterData.instituteId,
            trainingCentreName: trainingCenterData.trainingCentreName,
            stateUT: trainingCenterData.stateUT,
            city: trainingCenterData.city || trainingCenterData.district,
            tehsilMandalBlock: trainingCenterData.tehsilMandalBlock,
            address: trainingCenterData.address,
            pincode: trainingCenterData.pincode,
            subDistrict: trainingCenterData.subDistrict,
            landmark: trainingCenterData.landmark,
            typeOfBuilding: trainingCenterData.typeOfBuilding,
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
            console.log('Getting all training centers');
            
            const scanCommand = new ScanCommand({
                TableName: TABLE_NAME
            });
            
            const response = await docClient.send(scanCommand);
            console.log('Total training centers found:', response.Items?.length || 0);
            
            const items = response.Items || [];
            
            // Map items to include id field
            const mappedItems = items.map(item => ({
                id: item.TrainingCenterFormId || item.id,
                trainingCentreName: item.trainingCentreName || '',
                stateUT: item.stateUT || '',
                city: item.city || item.district || '',
                district: item.district || '',
                tehsilMandalBlock: item.tehsilMandalBlock || '',
                address: item.address || '',
                pincode: item.pincode || '',
                subDistrict: item.subDistrict || '',
                landmark: item.landmark || '',
                typeOfBuilding: item.typeOfBuilding || '',
                instituteId: item.instituteId || '',
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || ''
            }));
            
            console.log('Returning', mappedItems.length, 'training centers');
            return mappedItems;
        } catch (error) {
            console.error('Error getting all training centers:', error);
            return [];
        }
    }

    static async getByInstituteId(instituteId) {
        try {
            console.log('Getting training centers for instituteId:', instituteId);
            
            // Filter by instituteId
            const scanCommand = new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'instituteId = :instituteId',
                ExpressionAttributeValues: {
                    ':instituteId': instituteId
                }
            });
            
            const response = await docClient.send(scanCommand);
            console.log('Training centers found for institute:', response.Items?.length || 0);
            
            const items = response.Items || [];
            
            // Map items to include id field
            const mappedItems = items.map(item => ({
                id: item.TrainingCenterFormId || item.id,
                trainingCentreName: item.trainingCentreName || '',
                stateUT: item.stateUT || '',
                city: item.city || item.district || '',
                district: item.district || '',
                tehsilMandalBlock: item.tehsilMandalBlock || '',
                address: item.address || '',
                pincode: item.pincode || '',
                subDistrict: item.subDistrict || '',
                landmark: item.landmark || '',
                typeOfBuilding: item.typeOfBuilding || '',
                instituteId: item.instituteId || '',
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || ''
            }));
            
            console.log('Returning', mappedItems.length, 'training centers for institute');
            return mappedItems;
        } catch (error) {
            console.error('Error getting training centers:', error);
            return [];
        }
    }

    static async getCentersByInstitute(instituteId) {
        return this.getByInstituteId(instituteId);
    }

    static async getById(trainingCenterId) {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                TrainingCenterFormId: trainingCenterId
            }
        });

        const response = await docClient.send(command);
        return response.Item;
    }

    static async update(trainingCenterId, updateData) {
        const timestamp = new Date().toISOString();
        
        // Get existing item to preserve instituteId
        const existing = await this.getById(trainingCenterId);
        
        const item = {
            TrainingCenterFormId: trainingCenterId,
            id: trainingCenterId,
            instituteId: existing?.instituteId || updateData.instituteId,
            trainingCentreName: updateData.trainingCentreName,
            stateUT: updateData.stateUT,
            city: updateData.city || updateData.district,
            tehsilMandalBlock: updateData.tehsilMandalBlock,
            address: updateData.address,
            pincode: updateData.pincode,
            subDistrict: updateData.subDistrict,
            landmark: updateData.landmark,
            typeOfBuilding: updateData.typeOfBuilding,
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

    static async delete(trainingCenterId) {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                TrainingCenterFormId: trainingCenterId
            }
        });

        await docClient.send(command);
        return true;
    }
}

module.exports = TrainingCenterModel;
