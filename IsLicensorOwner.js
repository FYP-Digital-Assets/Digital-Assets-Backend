import Web3 from "web3";
import fs from 'fs';
const constants = JSON.parse(fs.readFileSync('Constants.json'));
const web3 = new Web3(new Web3.providers.HttpProvider(constants.rpc)); // Replace with your own local network endpoint
// const txHash = '0x405604b0338642f7e1b0c647461a8f0ff17ac2e2ffe85af76a166be9ea058ab7';

const contractAbi = constants.contracts.asset;
export async function IsLicensorOwner(contractAddr, userAddr){
    const contract = new web3.eth.Contract(contractAbi, contractAddr);
    const isLicensor = await contract.methods.isLicenser(userAddr).call();
    const isOwner = await contract.methods.isOwner(userAddr).call();
    return isLicensor || isOwner;
}