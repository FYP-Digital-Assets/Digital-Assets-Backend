import mongodb from 'mongodb'
//may be this connectionUri will not work so you must provide you own connection uri of mongodb
//const connectionURI ="mongodb+srv://shankar-01:Ugm9cynIDOMDNr55@cluster0.c7slzxj.mongodb.net/?retryWrites=true&w=majority";
const connectionURI = process.env.mongodbUri
const client = mongodb.MongoClient;
console.log(process.env.mongodbUri)
const db = client.connect(connectionURI)
export default (await db).db("DigitalAssets");