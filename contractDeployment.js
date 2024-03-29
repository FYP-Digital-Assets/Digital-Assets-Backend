import Web3 from 'web3';
import fs from 'fs';
let contractDetails, rpc;
try {
	const constants = JSON.parse(fs.readFileSync('Constants.json'));
    contractDetails = constants.contracts.digitalAsset;
    rpc = constants.rpc;
    console.log(rpc)
} catch (error) {
	console.error('Error:', error);
}

const web3 = new Web3(rpc);
const abi = contractDetails.abi;
const bytecode = contractDetails.bytecode;
const contract = new web3.eth.Contract(abi);
web3.eth.getAccounts().then((accounts) => {
  const firstAccount = accounts[0];
  console.log(`The first account is: ${firstAccount}`);
  contract.deploy({
    data: bytecode,
    arguments: []
  }).send({
    from: firstAccount, // the address of the account you want to deploy the contract from
    gas: 6721975, // the amount of gas you want to use for the deployment
    gasPrice: '30000000000' // the price you are willing to pay for each unit of gas
  }).then((newContractInstance) => {
    const constants = JSON.parse(fs.readFileSync('Constants.json'));
    constants.contracts.digitalAsset.address = newContractInstance.options.address;
    console.log(constants)
    fs.writeFile('Constants.json', JSON.stringify(constants), (err) => {
      if (err) throw err;
      console.log('Address stored in picDappAdd.txt', newContractInstance.options.address);
    });
  });
}).catch((error) => {
  console.error(error);
});
