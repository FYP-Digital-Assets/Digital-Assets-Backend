import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createHash } from 'crypto';
import db from './DbConnect.js';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { IPFSHandler } from './IPFSHandler.js';
import { publicEncrypt } from 'crypto';
import { privateDecrypt } from 'crypto';
import multer from 'multer';
import mime from 'mime-types'
import { ReadTX } from './ReadTX.js';
import { IsLicensorOwner } from './IsLicensorOwner.js';
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
    limits: { fieldSize: 2 * 1024 * 1024 }
  });
  var storageTemp = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./temporaryContent/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
const upload = multer({ storage: storage });
const tempUpload = multer({storage:storageTemp}); 
const thumbnails = multer({storage:storageThumb});
// app.use(function(req, res, next) {
//     // res.header("Access-Control-Allow-Origin", "*"); // update with specific domains for production use
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//   });
//get user info
app.post('/userInfo', async function(req, res){
    let account = await db.collection("Users").findOne({ethAddress:req.body.ethAddress});
    console.log("ethAddress", req.body.ethAddress)
    res.send({code:200, data:account});
  })

//get content
app.post('/content', async function(req, res){
    let contents = await db.collection("Contents").find(req.body.condition).toArray();
    res.send({code:200, data:contents})
})
//get latest content
app.post('/explore', async function(req, res){
  let {contentType} = req.body
  contentType = contentType.toLowerCase()
  if(contentType == "all"){
    contentType = ""
  }
  let contents;
  if(['audio', "video", "image", ""].includes(contentType)){
  contents = await db.collection("Contents").find({type:{ $regex: new RegExp(contentType, 'i') }}).sort({_id:-1}).skip(req.body.page*10).limit(10).toArray();
  }
  else{
    contents = await db.collection("Contents").find({type:{ $not:{ $in:[/^audio/, /^video/, /^image/] }}}).sort({_id:-1}).skip(req.body.page*10).limit(10).toArray();
  }
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

//logout api
app.post('/logout', async(req, res)=>{
  const {ethAddress} = req.body;
  await db.collection('UserLogs').deleteOne({ethAddress})
  res.send({code:"200", msg:"logout successful"})
})
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
//upload main content on ipfs and return encrypted cid
app.post('/uploadMainContent', tempUpload.single('file'), async(req, res)=>{
  
  let cid = await uploadIPFS(req);
  const hash = createHash('sha256').update(cid).digest("hex");
  const result = await db.collection("HashedCid").findOne({hash})
  console.log("result : ", result)
  if(result!=null){
    res.send({code:500, msg:"content already uploaded"})
    return;
  }
  await db.collection("HashedCid").insertOne({hash});
  //console.log(cid)
  const encrypted = publicEncrypt(publicKey, Buffer.from(cid.toString(), 'utf-8'))

  cid = encrypted.toString('base64url');
  res.send({code:"200", msg:"uploaded successful", cid:cid.toString()});
})
//upload clip of content on ipfs and return cid
app.post('/uploadClipContent', tempUpload.single('file'), async(req, res)=>{
  //console.log(req.files)
  let cid = await uploadIPFS(req);

  res.send({code:"200", msg:"today", cid});
})
//upload thumbnail on server, and store additional details on database
app.post('/uploadContent', thumbnails.single('file'), async(req, res)=>{
  console.log("body obj ",req.body.obj)
  const obj = JSON.parse(req.body.obj);
  
  await db.collection("Contents").insertOne({address:obj.address, title:obj.title, type:obj.type, description: obj.description,clip:obj.clip, thumbnail:req.file.filename, date:new Date().toLocaleString(), ext:obj.ext, view:0});

  res.send({code:200, msg:"content uploaded successfully!"});
})

//upload review of content
app.post('/uploadReview', async(req, res)=>{
  const {review, ethAddress, address} = req.body;
  console.log("review ", review)
  await db.collection("Reviews").insertOne({address, ethAddress, review});
  
  res.send({code:200, msg:"review uploaded"});
})

//input file then upload on ipfs and return cid
async function uploadIPFS(req){
  //console.log("file", req.file)
  const file = fs.readFileSync(req.file.path);
  let cid = await ipfs.addFile(file);
  //remove file from storage
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error(err);
    }
  });
  return cid;
}

//api to maintain history of user
app.post('/addHistory', async(req, res)=>{
  const {ethAddress, address, action} = req.body
  //action has only 3 possible values 0(view),1(license) and 2(ownership)
  await db.collection('History').insertOne({ethAddress, address, action, date:new Date()})
  res.send({code:200, msg:"history added"})
})
//api to get user history
app.get("/getHistory/:ethAddress", async(req, res)=>{
  const {ethAddress} = req.params;
  const history = await db.collection('History').find({ethAddress}).toArray()
  res.send({code:200, data:history})
})
//api for content detail fetch from database
app.get('/content/:address', async(req, res) => {
    console.log("hello");
    const address = req.params.address;
    const result = await db.collection("Contents").findOne({address})
    res.send({code:200, data:result});
});

//api for get most viewed content
app.get('/trending', async(req, res)=>{
  const records = await db.collection('Contents').find().sort({view:-1}).limit(10).toArray()
  res.send({code:200, data:records})
})

//get all reviews of content
app.get('/reviews/:address', async(req, res)=>{
  const address = req.params.address;
  const reviews = await db.collection("Reviews").find({address}).toArray();
  res.send({code:200, reviews})
})

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

//access content from ipfs with non encrypted cid
app.get('/ipfs/:cid/:ext', async function(req, res){
  const cid = req.params.cid;
  const ext = req.params.ext
  const buffer = await getDataBuffer(cid)
  const tempFilePath = "temporaryContent/"+cid+"."+ext;
  fs.writeFileSync(tempFilePath, buffer)
  
  // serve the file using res.sendFile
  res.sendFile(tempFilePath, {root:"." }, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send('Error serving file')
    }
    // delete the temporary file after sending it
    fs.unlinkSync(tempFilePath)
  })
})
app.get('/view/:address/:txHash/:ext', async function(req, res){
  const txHash = req.params.txHash;
  const ext = req.params.ext;
  const record = db.collection("ViewTxHistory").find({txHash});
  db.collection("Contents").updateOne({address:req.params.address}, {$inc:{view:1}})
  if(record){
    res.send({code:500, msg:"view already claimed"})
    return;
  }
  const data = await ReadTX(txHash);
  //console.log("data ", data)
  const encrypted = Buffer.from(data, 'base64url');
  
  // Decrypt the encrypted buffer with the private key
  const cid = privateDecrypt(privateKey, encrypted);
  const buffer = await getDataBuffer(cid)
  
  db.collection("ViewTxHistory").insertOne({txHash})
  
  const tempFilePath = "temporaryContent/"+cid+"."+ext;
  fs.writeFileSync(tempFilePath, buffer)
  
  // serve the file using res.sendFile
  res.sendFile(tempFilePath, { root:"." }, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send('Error serving file')
    }
    // delete the temporary file after sending it
    fs.unlinkSync(tempFilePath)
  })
})

app.get('/licenseOrOwner/:contractAddr/:userAddr/:cid/:ext', async function(req, res){
  const ext = req.params.ext
  const contractAddr = req.params.contractAddr;
  const userAddr = req.params.userAddr;
  const data = req.params.cid;
  const isLicensorOwner = await IsLicensorOwner(contractAddr, userAddr);
  //console.log("licensor : ", isLicensorOwner)
  if(!isLicensorOwner){
    res.send({code:500, msg:"not owner or licensor"})
    return;
  }
  //console.log("data ", data)
  db.collection("Contents").updateOne({address:contractAddr}, {$inc:{view:1}})
  const encrypted = Buffer.from(data, 'base64url');
  
  // Decrypt the encrypted buffer with the private key
  const cid = privateDecrypt(privateKey, encrypted);
  const buffer = await getDataBuffer(cid)
  
  const tempFilePath = "temporaryContent/"+cid+"."+ext;
  fs.writeFileSync(tempFilePath, buffer)
  
  // serve the file using res.sendFile
  res.sendFile(tempFilePath, { root:"." }, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send('Error serving file')
    }
    // delete the temporary file after sending it
    fs.unlinkSync(tempFilePath)
  })
})

//get data from ipfs and send it in buffer
async function getDataBuffer(cid){
  const file = await ipfs.getFile(cid);

  const fileContents = []
  for await (const chunk of file) {
    fileContents.push(chunk)
  }
  
  const buffer = Buffer.concat(fileContents)
  return buffer;
}

//api for digital asset contract address and abi
app.get('/digitalAssetContract', function(req, res){
  res.send({abi:constants.contracts.digitalAsset.abi, address:constants.contracts.digitalAsset.address});
});

//api for asset abi
app.get('/assetContract', function(req, res){
  res.send({abi:constants.contracts.asset})
})

//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
