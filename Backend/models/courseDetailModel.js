const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'mis-course-details';

class CourseDetailModel {
    static async create(data) {
        const id = uuidv4();
        const timestamp = new Date().toISOString();

        const item = {
            miscourses: id,
            id: id,
            instituteId: data.instituteId,
            trainingCentres: data.trainingCentres || [],
            sector: data.sector,
            course: data.course,
            minBatchProposed: data.minBatchProposed,
            classrooms: (data.classrooms || []).map(classroom => ({
                ...classroom,
                classroomType: classroom.classroomType || 'Classroom',
                photos: classroom.photos || []
            })),
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
                id: item.miscourses || item.id
            }));
        } catch (error) {
            console.error('Error getting course details:', error);
            return [];
        }
    }

    static async getById(id) {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                miscourses: id
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
                id: item.miscourses || item.id
            }));
        } catch (error) {
            console.error('Error getting course details by institute:', error);
            return [];
        }
    }

    static async update(id, data) {
        const timestamp = new Date().toISOString();
        const existing = await this.getById(id);

        const item = {
            miscourses: id,
            id: id,
            instituteId: existing?.instituteId || data.instituteId,
            trainingCentres: data.trainingCentres || [],
            sector: data.sector,
            course: data.course,
            minBatchProposed: data.minBatchProposed,
            classrooms: (data.classrooms || []).map(classroom => ({
                ...classroom,
                classroomType: classroom.classroomType || 'Classroom',
                photos: classroom.photos || []
            })),
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
                miscourses: id
            }
        });

        await docClient.send(command);
        return true;
    }
}

module.exports = CourseDetailModel;
