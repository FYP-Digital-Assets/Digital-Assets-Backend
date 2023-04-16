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
  //console.log("body ",req.body)
  const {title, description, clip, address} = req.body;
  
  await db.collection("Contents").insertOne({address, title,description,clip, thumbnail:req.file.filename, date:new Date().toLocaleString()});

  res.send({code:200, msg:"content uploaded successfully!"});
})

//upload review of content
app.post('/uploadReview', async(req, res)=>{
  const {review, ethAddress, address} = req.body;
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
//api for content detail fetch from database
app.get('/content/:address', async(req, res) => {
    console.log("hello");
    const address = req.params.address;
    const result = await db.collection("Contents").findOne({address})
    res.send({code:200, data:result});
});


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
app.get('/ipfs/:cid', async function(req, res){
  const cid = req.params.cid;
  
  const buffer = await getDataBuffer(cid)
  const contentType = mime.contentType(cid) || 'application/octet-stream'
  res.setHeader('Content-Disposition', `attachment; filename=${cid}`)
  res.setHeader('Content-Type', contentType)
  const tempFilePath = "temporaryContent/"+cid;
  fs.writeFileSync(tempFilePath, buffer)
  
  // serve the file using res.sendFile
  res.sendFile(tempFilePath, { type: contentType, root:"." }, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send('Error serving file')
    }
    // delete the temporary file after sending it
    fs.unlinkSync(tempFilePath)
  })
})
app.get('/ipfsEncrypted/:cid', async function(req, res){
  const encrypted = Buffer.from(req.params.cid, 'base64url');
  
  // Decrypt the encrypted buffer with the private key
  const cid = privateDecrypt(privateKey, encrypted);
  const buffer = await getDataBuffer(cid)
  const contentType = mime.contentType(cid) || 'application/octet-stream'
  res.setHeader('Content-Disposition', `attachment; filename=${cid}`)
  res.setHeader('Content-Type', contentType)
  const tempFilePath = "temporaryContent/"+cid;
  fs.writeFileSync(tempFilePath, buffer)
  
  // serve the file using res.sendFile
  res.sendFile(tempFilePath, { type: contentType, root:"." }, (err) => {
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
  res.send({abi:constants.contracts.asset.abi})
})

//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});