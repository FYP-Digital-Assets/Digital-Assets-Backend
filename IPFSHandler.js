import * as IPFS from 'ipfs-http-client'; //
export class IPFSHandler{
    //create IPFS node
    constructor(){
        this.node = IPFS.create({url:'http://127.0.0.1:5001'});
        // this.node = IPFS.create({
        //     url:"https://api.filebase.io/v1/ipfs",
        //     headers:{
        //         authorization:"Bearer MkUyMUJERUFGNTU2MUQ4NDgyMDk6d2tmSVhEc0Y2YjF2cUFSZU5mY0FWZmc5UEMzdXRKWGVhNTJsaUlEaTpkYXNzZXQ="
        //     }
        //   })
    }

    //add file add on ipfs and 
    async addFile(file) {
        let result = await this.node.add(file);
        //console.log(result)
        return result.path.toString();
    }
    

    //get content of IPFS using cid of content
    async getFile(hash){
        //read from ipfs
        let result = await this.node.cat(hash);
        return result; //it async iterable
    }
}