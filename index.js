import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createHash } from 'crypto';
import db from './DbConnect.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { IPFSHandler } from './IPFSHandler.js';

import multer from 'multer';
const port = 4000; //port number on which server runs
const app = express();
// app.use(cors());

//const ipfs = new IPFSHandler();

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
const constants = JSON.parse(fs.readFileSync('Constants.json'));
// Set up multer storage and limits
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./profileImgs/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + ".jpeg");
    },
  });

const upload = multer({ storage: storage });
const tempUpload = multer({dest:"temporaryContent/"}); 

// app.use(function(req, res, next) {
//     // res.header("Access-Control-Allow-Origin", "*"); // update with specific domains for production use
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//   });
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
//login api
app.post('/login', async (req,res)=>{
    let account = await db.collection("Users").findOne({ethAddress:req.body.user});
    if(account == null){
       await db.collection("Users").insertOne({name:"unnamed", ethAddress:req.body.user, bio:"N/A", img:"dummyProfile.jpg"})
       account = await db.collection("Users").findOne({ethAddress:req.body.user});
    }
    //get token and compare
    //console.log("user", req.body);
    const user = req.body.user;
    const token = req.cookies?req.cookies.token:null;
    //console.log("token ", token)
    const tokenDb = await getTokenFromDB(user);
    if(tokenDb != null && token == tokenDb.token){ //token matched and send account detail
        res.send({code:200, data:account});
        return;
    }
    if(tokenDb == null){
        let ntoken = generateToken(user); // generateToken() is a function to generate a token
        await db.collection("UserLogs").insertOne({ethAddress:user, token:ntoken})
        res.cookie('token', ntoken, { maxAge: 10000*1000*60*60*24*30, httpOnly: true, path:"/", secure:true, sameSite:'none'}); 
        res.send({code:200, data:account});
        
        return;
    }
    res.send({code:500, msg:"logout account from other devices!!!"});
});
//generate token by taking hash of ethereum address and date
function generateToken(user){ 
    return createHash('sha256').update(user+(new Date().getTime())).digest('hex');
}
//reterieve token from db
async function getTokenFromDB(user){
    //read token from DB
    return await db.collection("UserLogs").findOne({ethAddress:user})
}
//update account api
app.post('/updateProfile', upload.single('image'), async function(req, res){
    if(!req.file){
        res.send({code:500, msg:'account Update failed'});
    }
    else{
      db.collection("Users").updateOne({ ethAddress: req.body.ethAddress }, { $set: { img: req.file.filename} }, false, (result, err)=>{
        res.send({code:200, msg:'account profile update successful!'});
      })
      
    }
  });
app.post('/updateDetails', async function(req, res){
  db.collection("Users").updateOne({ethAddress:req.body.ethAddress}, {$set:req.body.details})
  res.send({code:200, msg:"account update successful"})
})
//upload content on ipfs
app.post('/uploadContent', tempUpload.array('files'), function(req, res){
  console.log(req.files[0].path);
  res.send({code:200})
})

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
//access profile images with url
app.get('/profileImgs/:filename', function(req, res) {
    const fileName = req.params.filename;
    res.sendFile("profileImgs/"+fileName, { root: '.' })
  });
//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});