const { dynamoClient, isUsingMockDB, mockDB, HRMS_ORGANIZATION_CHART_TABLE, HRMS_EMPLOYEES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const createOrgNode = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { employeeId, parentId, level, position } = req.body;

    if (level === undefined || !position) {
      return res.status(400).json(errorResponse('Position title and level are required'));
    }

    const nodeId = generateId();
    
    if (parentId && parentId === nodeId) {
      return res.status(400).json(errorResponse('A node cannot be its own parent'));
    }
    
    const orgNode = {
      nodeId,
      recruiterId,
      employeeId: employeeId || null,
      level: parseInt(level),
      position: position,
      children: [],
      createdAt: getCurrentTimestamp(),
      createdBy: req.user?.userId || 'system'
    };

    if (parentId && parentId !== '' && parentId !== 'null') {
      orgNode.parentId = parentId;
    }

    console.log('Creating org node:', orgNode);

    if (isUsingMockDB()) {
      mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, orgNode);
      
      // Update parent's children array if parentId exists
      if (parentId && parentId !== '') {
        const parent = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, parentId);
        if (parent) {
          const updatedChildren = [...(parent.children || []), nodeId];
          const updatedParent = { ...parent, children: updatedChildren };
          mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedParent);
        }
      }
    } else {
      const command = new PutCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        Item: orgNode
      });
      await dynamoClient.send(command);

      // Update parent's children array if parentId exists
      if (parentId && parentId !== '') {
        const getParentCommand = new GetCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          Key: { nodeId: parentId }
        });
        const parentResult = await dynamoClient.send(getParentCommand);

        if (parentResult.Item) {
          const updatedChildren = [...(parentResult.Item.children || []), nodeId];
          
          const updateParentCommand = new UpdateCommand({
            TableName: HRMS_ORGANIZATION_CHART_TABLE,
            Key: { nodeId: parentId },
            UpdateExpression: 'SET children = :children',
            ExpressionAttributeValues: {
              ':children': updatedChildren
            }
          });
          await dynamoClient.send(updateParentCommand);
        }
      }
    }

    console.log('Returning created node:', orgNode);
    res.status(201).json(successResponse(orgNode, 'Organization node created successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getOrganizationChart = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    let orgNodes;
    if (isUsingMockDB()) {
      const allNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
      orgNodes = allNodes.filter(n => n.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      orgNodes = result.Items || [];
    }

    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      employees = allEmployees.filter(e => e.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    // Create employee lookup map
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // Enrich organization nodes with employee data
    const enrichedNodes = orgNodes.map(node => ({
      ...node,
      employee: employeeMap[node.employeeId] || null
    }));

    // Build hierarchical structure
    const nodeMap = {};
    const rootNodes = [];

    // First pass: create node map
    enrichedNodes.forEach(node => {
      nodeMap[node.nodeId] = { ...node, children: [] };
    });

    // Second pass: build hierarchy
    enrichedNodes.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        nodeMap[node.parentId].children.push(nodeMap[node.nodeId]);
      } else {
        // This is a root node (no parent or parent doesn't exist)
        rootNodes.push(nodeMap[node.nodeId]);
      }
    });

    console.log('Organization hierarchy built:', {
      totalNodes: enrichedNodes.length,
      rootNodes: rootNodes.length,
      nodeMap: Object.keys(nodeMap)
    });

    // Sort by level
    rootNodes.sort((a, b) => a.level - b.level);

    res.json(successResponse({
      nodes: enrichedNodes,
      hierarchy: rootNodes
    }, 'Organization chart retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const updateOrgNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.nodeId;
    delete updates.createdAt;
    delete updates.createdBy;

    // Check if node exists
    let existingNode;
    if (isUsingMockDB()) {
      existingNode = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, id);
      if (!existingNode) {
        return res.status(404).json(errorResponse('Organization node not found'));
      }
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        Key: { nodeId: id }
      });
      const result = await dynamoClient.send(getCommand);
      existingNode = result.Item;

      if (!existingNode) {
        return res.status(404).json(errorResponse('Organization node not found'));
      }
    }

    // Prevent circular reference
    if (updates.parentId && updates.parentId === id) {
      return res.status(400).json(errorResponse('A node cannot be its own parent'));
    }

    // Handle parent change
    if (updates.parentId !== undefined && updates.parentId !== existingNode.parentId) {
      if (isUsingMockDB()) {
        // Remove from old parent's children
        if (existingNode.parentId) {
          const oldParent = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, existingNode.parentId);
          if (oldParent) {
            const updatedChildren = (oldParent.children || []).filter(childId => childId !== id);
            const updatedOldParent = { ...oldParent, children: updatedChildren };
            mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedOldParent);
          }
        }

        // Add to new parent's children
        if (updates.parentId) {
          const newParent = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, updates.parentId);
          if (newParent) {
            const updatedChildren = [...(newParent.children || []), id];
            const updatedNewParent = { ...newParent, children: updatedChildren };
            mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedNewParent);
          }
        }
      } else {
        // Remove from old parent's children
        if (existingNode.parentId) {
          const getOldParentCommand = new GetCommand({
            TableName: HRMS_ORGANIZATION_CHART_TABLE,
            Key: { nodeId: existingNode.parentId }
          });
          const oldParentResult = await dynamoClient.send(getOldParentCommand);

          if (oldParentResult.Item) {
            const updatedChildren = (oldParentResult.Item.children || []).filter(childId => childId !== id);
            const updateOldParentCommand = new UpdateCommand({
              TableName: HRMS_ORGANIZATION_CHART_TABLE,
              Key: { nodeId: existingNode.parentId },
              UpdateExpression: 'SET children = :children',
              ExpressionAttributeValues: { ':children': updatedChildren }
            });
            await dynamoClient.send(updateOldParentCommand);
          }
        }

        // Add to new parent's children
        if (updates.parentId) {
          const getNewParentCommand = new GetCommand({
            TableName: HRMS_ORGANIZATION_CHART_TABLE,
            Key: { nodeId: updates.parentId }
          });
          const newParentResult = await dynamoClient.send(getNewParentCommand);

          if (newParentResult.Item) {
            const updatedChildren = [...(newParentResult.Item.children || []), id];
            const updateNewParentCommand = new UpdateCommand({
              TableName: HRMS_ORGANIZATION_CHART_TABLE,
              Key: { nodeId: updates.parentId },
              UpdateExpression: 'SET children = :children',
              ExpressionAttributeValues: { ':children': updatedChildren }
            });
            await dynamoClient.send(updateNewParentCommand);
          }
        }
      }
    }

    // Update the node itself
    if (isUsingMockDB()) {
      const updatedNode = { ...existingNode, ...updates };
      mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedNode);
      res.json(successResponse(updatedNode, 'Organization node updated successfully'));
    } else {
      // Build update expression for the node
      const setExpressions = [];
      const removeExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        if (key === 'parentId' && (!updates[key] || updates[key] === '')) {
          // Remove parentId if it's empty
          removeExpressions.push(`#${key}`);
          expressionAttributeNames[`#${key}`] = key;
        } else {
          // Set the value normally
          setExpressions.push(`#${key} = :val${index}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:val${index}`] = updates[key];
        }
      });

      let updateExpression = '';
      if (setExpressions.length > 0) {
        updateExpression += `SET ${setExpressions.join(', ')}`;
      }
      if (removeExpressions.length > 0) {
        updateExpression += (updateExpression ? ' ' : '') + `REMOVE ${removeExpressions.join(', ')}`;
      }

      const updateParams = {
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        Key: { nodeId: id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW'
      };

      if (Object.keys(expressionAttributeValues).length > 0) {
        updateParams.ExpressionAttributeValues = expressionAttributeValues;
      }

      const updateCommand = new UpdateCommand(updateParams);
      const result = await dynamoClient.send(updateCommand);

      res.json(successResponse(result.Attributes, 'Organization node updated successfully'));
    }

  } catch (error) {
    handleError(error, res);
  }
};

const deleteOrgNode = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if node exists
    let existingNode;
    if (isUsingMockDB()) {
      existingNode = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, id);
      if (!existingNode) {
        return res.status(404).json(errorResponse('Organization node not found'));
      }

      // Remove from parent's children array
      if (existingNode.parentId) {
        const parent = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, existingNode.parentId);
        if (parent) {
          const updatedChildren = (parent.children || []).filter(childId => childId !== id);
          const updatedParent = { ...parent, children: updatedChildren };
          mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedParent);
        }
      }

      // Update children to have no parent (or reassign to grandparent)
      if (existingNode.children && existingNode.children.length > 0) {
        for (const childId of existingNode.children) {
          const child = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, childId);
          if (child) {
            const updatedChild = { ...child };
            if (existingNode.parentId) {
              updatedChild.parentId = existingNode.parentId;
            } else {
              delete updatedChild.parentId;
            }
            mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, updatedChild);
          }
        }
      }

      mockDB().delete(HRMS_ORGANIZATION_CHART_TABLE, id);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        Key: { nodeId: id }
      });
      const result = await dynamoClient.send(getCommand);
      existingNode = result.Item;

      if (!existingNode) {
        return res.status(404).json(errorResponse('Organization node not found'));
      }

      // Remove from parent's children array
      if (existingNode.parentId) {
        const getParentCommand = new GetCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          Key: { nodeId: existingNode.parentId }
        });
        const parentResult = await dynamoClient.send(getParentCommand);

        if (parentResult.Item) {
          const updatedChildren = (parentResult.Item.children || []).filter(childId => childId !== id);
          const updateParentCommand = new UpdateCommand({
            TableName: HRMS_ORGANIZATION_CHART_TABLE,
            Key: { nodeId: existingNode.parentId },
            UpdateExpression: 'SET children = :children',
            ExpressionAttributeValues: { ':children': updatedChildren }
          });
          await dynamoClient.send(updateParentCommand);
        }
      }

      // Update children to have no parent (or reassign to grandparent)
      if (existingNode.children && existingNode.children.length > 0) {
        for (const childId of existingNode.children) {
          const updateParams = {
            TableName: HRMS_ORGANIZATION_CHART_TABLE,
            Key: { nodeId: childId }
          };
          
          if (existingNode.parentId) {
            updateParams.UpdateExpression = 'SET parentId = :parentId';
            updateParams.ExpressionAttributeValues = { ':parentId': existingNode.parentId };
          } else {
            updateParams.UpdateExpression = 'REMOVE parentId';
          }
          
          const updateChildCommand = new UpdateCommand(updateParams);
          await dynamoClient.send(updateChildCommand);
        }
      }

      const deleteCommand = new DeleteCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        Key: { nodeId: id }
      });
      await dynamoClient.send(deleteCommand);
    }

    res.json(successResponse(null, 'Organization node deleted successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  createOrgNode,
  getOrganizationChart,
  updateOrgNode,
  deleteOrgNode
};