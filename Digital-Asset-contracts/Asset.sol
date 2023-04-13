// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Asset{
    address[] private licenseBuyer; //license buyer addresses
    address[] private ownersHistory; //all past and current owner addresses
    string private clipRef; //reference of clip of content
    string private contentRef; //reference of content
    uint private sellingPrice; //selling price of content
    uint private licensePrice; //license price of content
    uint private viewFee; //fees for content view
    event contentEvent(string value);
    address private organization;
    //parameterized constructor
    constructor(address owner, string memory _contentRef, string memory _clipRef, uint _sellingPrice, uint _licensePrice, uint _viewFee, address _organization) public{
        clipRef = _clipRef;
        sellingPrice = _sellingPrice;
        licensePrice = _licensePrice;
        viewFee = _viewFee;
        ownersHistory.push(owner);
        contentRef = contentRef;
        organization = _organization;
    }
    modifier ownerCheck{
        require(getOwner() == msg.sender);
        _;
    }
    modifier costs(uint price){
      require(
         msg.value >= price,
         "Not enough money."
      );
      _;
   }
    function contains(address[] memory adrs, address adr) private pure returns(bool){
        for (uint i = 0; i < adrs.length; i++) {
            if (adrs[i] == adr) {
                return true;
            }
        }
        return false;
    }
    function wasOwner(address person) public view returns(bool){
        return contains(ownersHistory, person);
    }
    function getOwner() public view returns(address){
        return ownersHistory[ownersHistory.length-1];
    }
    function isOwner(address user) public view returns(bool){
        return ownersHistory[ownersHistory.length-1] == user;
    }
    function isLicenser(address user) public view returns(bool){
        return contains(licenseBuyer, user);
    }
    function getClip() public view returns(string memory){
        return clipRef;
    }
    function getContent() public view returns(string memory){
        if(isOwner(msg.sender) || isLicenser(msg.sender)){
            return contentRef;
        }
        else{
            return "";
        }
    }
    function getLicensePrice() public view returns(uint){
        return licensePrice;
    }
    function getSellingPrice() public view returns(uint){
        return sellingPrice;
    }
    function getViewFee() public view returns(uint){
        return viewFee;
    }
    function buyView() public payable costs(viewFee){
        uint commission = viewFee/5;
        payable(organization).transfer(commission);
        payable(getOwner()).transfer(viewFee-commission);
        payable(msg.sender).transfer(msg.value-viewFee-commission);
        emit contentEvent(contentRef);
    }
    function buyLicense() public payable costs(licensePrice){
        licenseBuyer.push(msg.sender);
        uint commission = licensePrice/5;
        payable(organization).transfer(commission);
        payable(getOwner()).transfer(licensePrice-commission);
        payable(msg.sender).transfer(msg.value-licensePrice-commission);
        emit contentEvent(contentRef);
    }
    function buyContent() public payable costs(sellingPrice){
        ownersHistory.push(msg.sender);
        uint commission = sellingPrice/5;
        payable(organization).transfer(commission);
        payable(getOwner()).transfer(sellingPrice-commission);
        payable(msg.sender).transfer(msg.value-sellingPrice-commission);
        emit contentEvent(contentRef);
    }
    function canBuyView() public view returns(bool){

        return viewFee > 0;
    }
    function canBuyLicense() public view returns(bool){
        return licensePrice > 0;
    }
    function canBuyContent() public view returns(bool){
        return sellingPrice > 0;
    }
    function setPrices(uint _sellingPrice, uint _licensePrice, uint _viewFee) public {
        sellingPrice = _sellingPrice;
        licensePrice = _licensePrice;
        viewFee = _viewFee;
    }
    function getPrices()public view returns(uint[3] memory){
        return [sellingPrice, licensePrice, viewFee];
    }
}