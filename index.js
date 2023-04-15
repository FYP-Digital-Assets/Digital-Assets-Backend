import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createHash } from 'crypto';
import db from './DbConnect.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { IPFSHandler } from './IPFSHandler.js';
import { publicEncrypt } from 'crypto';
import { publicDecrypt } from 'crypto';
import multer from 'multer';
const port = 4000; //port number on which server runs
const app = express();
// app.use(cors());

const ipfs = new IPFSHandler();

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBvNvbfdS3ZqrJFRlYSH1VteY3
sW94kCyhZhpr5eqcgieMktNSVgekbiBsrers9etNJ2wFzxYIRy0wpChQnRZRI6a3
9Fi9ZtQSgZ6GF10MDYZEcBmhmJ+AuwEk5Glh8sYdqcv234bZDgUeaUtECNq2GPjS
F+MDom4JWBD+wg/bhwIDAQAB
-----END PUBLIC KEY-----`;
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQCBvNvbfdS3ZqrJFRlYSH1VteY3sW94kCyhZhpr5eqcgieMktNS
VgekbiBsrers9etNJ2wFzxYIRy0wpChQnRZRI6a39Fi9ZtQSgZ6GF10MDYZEcBmh
mJ+AuwEk5Glh8sYdqcv234bZDgUeaUtECNq2GPjSF+MDom4JWBD+wg/bhwIDAQAB
AoGACOPzQQBHcmXzsCHlAbq99ACqDQj4tY9Tr5+6kchIon78zNJG7u58SZVOXYQx
hBl6DWh1K5S8Usbl3t5w8M1C+SRDdxLTeIWqYiAkZ66rfcm4HStvkCPo7Zf/G1yX
Bj1q3rb2CF6ga9MvBIcormJPmE46ftZNDP+UxeD62RJl68ECQQD4dxQxqV3qvRIW
JoRnryYPq1tEuMvf/219iWRNZ6BdAhgs654r5AomblEzBPXHyu+Z9D1wIDJXrrvL
38SE2FRnAkEAhawOy5p9deHF2Q4a7yutfWBNziMCyJULffSC334W1g8Hm0X2u69v
50GKrfgCf2yKe3AkM0DkESFg8VS8wwDL4QJAGHjqFUYgSPmcaXAbxHac4hg3ohot
gn+PEjlRFsqpIeAN74a5iosocMaW2taXOrmDRf+neX7CVp6QQrFkks0X6wJAQenB
sewQCVy27nziEyV6euRN+WOSL84uyIEVN5c5M3xdx9cL/yhXCbVr6LTupl6jOpLl
htBspXXME7QxEAcIgQJASI5GnTgf41gTFbNj6rGB9OozKST0F15dHsGFYOcWLJz0
7GqPRR8E62qpoMJwCYDzZ04TWkOLhKwV/VJJnyT7Nw==
-----END RSA PRIVATE KEY-----`;

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
var storageThumb = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./thumbnails/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + ".jpeg");
    },
  });
const upload = multer({ storage: storage });
const tempUpload = multer({dest:"temporaryContent/"}); 
const thumbnails = multer({storage:storageThumb});
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
//upload content on ipfs and return cid
app.post('/uploadMainContent', tempUpload.single('file'), async(req, res)=>{
  
  let cid = await uploadIPFS(req);
  console.log(cid)
  const encrypted = publicEncrypt(publicKey, Buffer.from(cid.toString(), 'utf-8'))
  cid = encrypted.toString('base64');
  res.send({code:"200", msg:"uploaded successful", cid:cid.toString()});
})
app.post('/uploadClipContent', tempUpload.single('file'), async(req, res)=>{
  //console.log(req.files)
  let cid = await uploadIPFS(req);
  console.log(cid)
  res.send({code:"200", msg:"today", cid:cid.toString()});
})
app.post('/uploadContent', thumbnails.single('file'), async(req, res)=>{
  console.log("body ",req.body)
  const {title, description, clip, address} = req.body;
  await db.collection("Contents").insertOne({address, title,description,clip, thumbnail:req.file.filename, date:new Date().toLocaleString()});
  res.send({code:200, msg:"content uploaded successfully!"});
})
async function uploadIPFS(req){
  let cid = await ipfs.addFile({path:req.file, content:req.file.buffer});
  //remove file from storage
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error(err);
    }
  });
  return cid;
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

//api for content detail fetch from database
app.get('/content/:address', async(req, res) => {
    console.log("hello");
    const address = req.params.address;
    const result = await db.collection("Contents").findOne({address})
    res.send({code:200, data:result});
});
//access profile images with url
app.get('/profileImgs/:filename', function(req, res) {
    const fileName = req.params.filename;
    res.sendFile("profileImgs/"+fileName, { root: '.' })
  });
//access thumbnail image with url
app.get('/thumbnail/:filename', function(req, res) {
    const fileName = req.params.filename;
    res.sendFile("thumbnails/"+fileName, { root: '.' })
  });
//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});