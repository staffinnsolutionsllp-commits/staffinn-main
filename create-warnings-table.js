const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({ region: "ap-south-1" });
client.send(new CreateTableCommand({
  TableName: "staffinn-hrms-warnings",
  AttributeDefinitions: [{ AttributeName: "warningId", AttributeType: "S" }],
  KeySchema: [{ AttributeName: "warningId", KeyType: "HASH" }],
  BillingMode: "PAY_PER_REQUEST"
})).then(r => console.log("DONE:", r.TableDescription.TableStatus)).catch(e => {
  if (e.name === "ResourceInUseException") console.log("Table already exists");
  else console.log("ERROR:", e.message);
});
