import * as IPFS from 'ipfs-core'; //
export class IPFSHandler{
    //create IPFS node
    constructor(){
        this.node = IPFS.create();
    }

    //add file add on ipfs
    async addFile(file) {
        return await (await this.node).add(file);
    }
    

    //get content of IPFS using cid of content
    async getFile(hash){
        //read from ipfs
        return await (await this.node).cat(hash); //it async iterable
    }
}