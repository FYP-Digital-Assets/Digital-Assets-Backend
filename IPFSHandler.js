import * as IPFS from 'ipfs-http-client'; //
export class IPFSHandler{
    //create IPFS node
    constructor(){
        this.node = IPFS.create({url:'http://127.0.0.1:5001'});
    }

    //add file add on ipfs and 
    async addFile(file) {
        let result = await this.node.add(file);
        return result.cid;
    }
    

    //get content of IPFS using cid of content
    async getFile(hash){
        //read from ipfs
        let result = await this.node.cat(hash);
        return result; //it async iterable
    }
}