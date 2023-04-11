import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createHash } from 'crypto';
import db from './DbConnect.js';
const port = 4000; //port number on which server runs
const app = express();
app.use(cors());
app.use(express.json());
const constants = JSON.parse(fs.readFileSync('Constants.json'));

//get user info
app.get('/userInfo', async function(req, res){
    let account = await db.collection("Users").findOne({ethAddress:req.body.ethAddress});
    res.send({code:200, data:account});
  })

//get content
app.get('/content', async function(req, res){
    let contents = await db.collection("Contents").find(req.body.condition).toArray();
    res.send({code:200, data:contents})
})
//add content data in db
app.post('/uploadContent',(req, res) => {
    
});
app.get('/login', (res,req)=>{
    
    //get token and compare
    const user = req.body.user;
    const token = req.cookies.token;
    const tokenDb = getTokenFromDB(user);
    if(token == tokenDb){ //token matched
        res.send({code:200, msg:"token matched!!!"});
        return;
    }
    if(tokenDb == null){
        const token = generateToken(user); // generateToken() is a function to generate a token
        res.cookie('token', token, { maxAge: 1000*60*60*24*30, httpOnly: true }); // set the token as a cookie with a max age of 15 minutes
        res.send({code:200, msg:"token sent!!!"});
        return;
    }
    res.send({code:500, msg:"logout account from other devices!!!"});
});
function generateToken(user){
    return createHash('sha256').update(user+(new Data().getTime())).digest('hex');
}
function getTokenFromDB(user){
    //read token from DB
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
    //const file = await ipfsNode.getFile(req.params.cid);
    //file.pipe(res);
    res.send({code:200});
});

//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});