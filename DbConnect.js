import mongodb from 'mongodb'
const connectionURI ="mongodb+srv://shankar-01:Ugm9cynIDOMDNr55@cluster0.c7slzxj.mongodb.net/?retryWrites=true&w=majority";
const client = mongodb.MongoClient;
const db = client.connect(connectionURI)
export default (await db).db("DigitalAssets");