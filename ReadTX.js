import Web3 from "web3";
import fs from 'fs';
const constants = JSON.parse(fs.readFileSync('Constants.json'));
const web3 = new Web3(new Web3.providers.HttpProvider(constants.rpc)); // Replace with your own local network endpoint
// const txHash = '0x405604b0338642f7e1b0c647461a8f0ff17ac2e2ffe85af76a166be9ea058ab7';
const inputs = constants.contracts.asset[0].inputs;
export function ReadTX(txHash){
// Get the transaction receipt
const data = web3.eth.getTransactionReceipt(txHash).then(receipt => {
    const event = receipt.logs[0];
  if (event) {
    return web3.eth.abi.decodeLog(inputs, event.data, event.topics).value;
  } else {
    console.log('No event found in transaction receipt');
  }
}).catch(error => {
  console.error('Error retrieving transaction receipt:', error);
});
return data;
}