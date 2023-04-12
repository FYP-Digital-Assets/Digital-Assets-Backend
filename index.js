import express from 'express';
// import cors from 'cors';
import fs from 'fs';
import { createHash } from 'crypto';
import db from './DbConnect.js';
const port = 4000; //port number on which server runs
const app = express();
// app.use(cors());
app.use(express.json());
const constants = JSON.parse(fs.readFileSync('Constants.json'));

//get user info
app.post('/userInfo', async function(req, res){
    let account = await db.collection("Users").findOne({ethAddress:req.body.ethAddress});
    res.send({code:200, data:account});
  })

//get content
app.post('/content', async function(req, res){
    let contents = await db.collection("Contents").find(req.body.condition).toArray();
    res.send({code:200, data:contents})
})
//add content data in db
app.post('/uploadContent',(req, res) => {
    
});
app.post('/login', async (req,res)=>{
    let account = await db.collection("Users").findOne({ethAddress:req.body.user});
    if(account == null){
       await db.collection("Users").insertOne({name:"unnamed", ethAddress:req.body.user, bio:"N/A", img:"https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_1280.png"})
       account = await db.collection("Users").findOne({ethAddress:req.body.user});
    }
    //get token and compare
    const user = req.body.user;
    const token = req.cookies?req.cookies.token:null;
    const tokenDb = await getTokenFromDB(user);
    if(tokenDb != null && token == tokenDb.token){ //token matched and send account detail
        res.send({code:200, data:account});
        return;
    }
    if(tokenDb == null){
        let ntoken = generateToken(user); // generateToken() is a function to generate a token
        await db.collection("UserLogs").insertOne({ethAddress:user, token:ntoken})
        res.cookie('token', ntoken, { maxAge: 10000*1000*60*60*24*30, httpOnly: true }); 
        res.send({code:200, data:account});
        
        return;
    }
    res.send({code:500, msg:"logout account from other devices!!!"});
});
function generateToken(user){
    return createHash('sha256').update(user+(new Date().getTime())).digest('hex');
}
async function getTokenFromDB(user){
    //read token from DB
    return await db.collection("UserLogs").findOne({ethAddress:user})
}
//api for contract's abi
app.get('/contractsAbi', function(req, res){
    console.log("abi");
    res.send({abi:constants.contracts.digitalAsset.abi});
});

//api for contract address
app.get('/contractAddress', function(req, res){
    res.send({address:constants.contracts.digitalAsset.address});
});

//api for content fetch from ipfs
app.get('/content/:cid', (req, res) => {
    console.log("hello");
    //const file = await ipfsNode.getFile(req.body.cid);
    //file.pipe(res);
    res.send({code:200});
});

//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});