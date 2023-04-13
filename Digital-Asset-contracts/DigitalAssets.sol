// SPDX-License-Identifier: MIT
pragma solidity^0.8.0;
import "./Asset.sol";
contract DigitalAssets{
    Asset[] private assets; //owner's mapping with their created content
    address private organization; //address of organization
    constructor(){
        organization = msg.sender;
    }

    //get contents associated with the owner of content
    function getContents(address owner) public view returns(Asset[] memory){ //get all the content of owner
        //count total contents of owner on platform
        uint count = 0;
        for(uint i=0; i < assets.length; i++){
            if(assets[i].isOwner(owner)){
                count++;
            }
        }
        //traverse through array and find contents of owner 
        Asset[] memory result = new Asset[](count);
        count = 0;
        for(uint i=0; i < assets.length; i++){
            if(assets[i].isOwner(owner)){
                result[count++] = assets[i];
            }
        }
        return result;
    }

    //create new contract for content and store it on assets map
    function addContent(string memory _contentRef, string memory _clipRef, uint _sellingPrice, uint _licensePrice, uint _viewFee) public { //add new content
        assets.push(new Asset(msg.sender, _contentRef, _clipRef, _sellingPrice, _licensePrice, _viewFee, organization));
    }
}