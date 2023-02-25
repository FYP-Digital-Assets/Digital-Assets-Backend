import express from 'express';
import cors from 'cors';
const port = 4000; //port number on which server runs
const app = express();
app.use(cors());
app.use(express.json());

//api for upload content on ipfs
app.post('/uploadContent',(req, res) => {
    
});

//api for contract's abi
app.get('/contractsAbi', function(req, res){
    
});

//api for contract address
app.get('/contractAddress', function(req, res){
    
});

//api for content fetch
app.get('/content/:tokenId', function(req, res){

})

//

//server start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});