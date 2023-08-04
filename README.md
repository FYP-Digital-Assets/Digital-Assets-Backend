# Prerequisite
You should have following things installed:
- Jsipfs
- Ganache
- MongoDB
- NodeJS
# How to run
Follow the steps to run Backend of Application:
 - open terminal and run `jsipfs daemon` command
 - start ganache ethereum workspace
 - run contractDeployement using `node contractDeployement.js` command
 - open terminal in project directory and run `npm i` command, to make sure all dependencies are installed
 - now run `mongodbUri=<Connection URI of MongoDB> npm start` command with your mongodb connection uri, to start backend
 - now you should move to frontend directory and start it, You will find instructions to run frontend in README file of frontend repository!
# Description of APIs
UserInfo
goal: get information of user such as profile, name and bio
input: send ethereum address in body with key as "ethAddress".
working:
find record where the ethAddress is same(body.ethAddress).
send retrieved record as response.

Content
goal: fetch content from database on the basis of some condition
input: send condition(mongodb query) in body with key as "condition"
working:
find records that meet the condition.
send retrieved records in array format as response.

* login
goal: register/authenticate user and send information of user
input: send ethereum address in body with key as "user" and cookies.token
working:
find record where ethAddress is same (body.user).
if record is null (means user is not registered) so insert record in database and remember it for further steps
retrieve token from database associated with ethAddress of user
if token (from Database) is equal to cookies.token then send account info as response else send message "logout account from database"
and if token(from database) is null (means user is doing first time login) then generate token store it in database with ethAddress and send token in cookie and send account info as response.

Note: token is hash of ethAddress of user and timestamp, for hashing sha256 algorithm is used.

* updateProfile
goal: update the profile picture of user.
input: send image file in body with key as "image"
working:
if file not sent in request, send message "account update failed" as response
otherwise store image on server and update user record(set img field to filename of image)
send message "account profile update successful!" as response

* updateDetails
goal: update the details of user such as name and bio.
input: send details json object in body with key as "details" and ethAdress with key as "ethAddress"
working;
update detail of user with same ethAddress (body.ethAddress)
send message "account update successful" as response.

* uploadMainContent
goal: upload main content of user of IPfS, ensure uniqueness of content
input: send file in body with key as "file"
working:
store file in temporary directory
upload file on IPFS and find CID (content id) and remove content from temporary directory
create hash of cid
find that is hash already available in database?
if hash is available send message "content already uploaded" as response
otherwise store hash in database and send encrypted cid as response

Note: we are storing hash CID in databse to avoid plagirised content and we are doing hash so if some one find database record it will get nothing. We are encrypting cid with a public key so that if some one remeber CID he cannot actually get the content without our platform.

* uploadClipContent
goal: upload clip/preview of main content on ipfs
input: send file in body with key as "file"
working:
store file in temporary directory
upload file on IPFS and find CID (content id) and remove content from temporary directory
send CID as response.

* uploadContent
goal: upload detail of content on database such as thumbnail, title, description, contract address
input: send image of thumbnail with key as file and other details.
working:
extract title, description, clip CID, and address from request.
add record with above details and additionally add current data into database
send message "content uploaded successful" as response.

* uploadReview
goal: upload review of content on databse.
input: send review, contract address of content ethAddress of user.
working:
extract review, address and ethAddress from request
store all things on database
send message "review uploaded" as response.

* content/:address
goal: fetch content detail from database associated to contract address.
input: send contract address of content in parameter of url as "address"
working:
fetch address from url
find record with same address in database
send record as response

* review/:address
goal: get all reviews related to contract address of content
input: send contract address of content as parameter in url as "address"
working:
fetch address from url
find record with same address in database
send record as response

profileImgs/:filename
goal: fetch profile image from server storage
input: send filename of profile image as parameter in url as "filename"
working:
extract filename parameter
read image from server storage
send image as response

thumbnail/:filename
goal: fetch thumbnail image from server storage
input: send filename of thumbnail image as parameter in url as "filename"
working:
extract filename parameter
read image from server storage
send image as response

ipfs/:cid
goal: fetch clip/preview from IPFS
input: send cid as parameter in url as "cid"
working:
extract cid from parameter
read content from IPFS in buffer.
store it in temprary directory
send file as reponse and remove file from temporary directory.

* view/:txHash
goal: ensure transaction for viewership of content, avoid double spending of view and send content from ipfs to user.
input: send transaction hash as parameter in url as "txHash"
working:
extract txHash from parameter
find record with same txhash if record is already available send message "view already claimed" otherwise move further
read transaction from blockchain and read cid of content from event of transaction
decrypt cid with private key, read content from IPFS in buffer
store content file on temprary directory
send file as response and remove file from temporary directory
store transaction hash on database

* licenseOrOwner/:contractAddr/:userAddr/:cid
goal: ensure that user is licensor or owner then send content from IPFS to user.
input: send contract address, user address, and CID as parameter in url as contractAddr, userAddr and cid
working:
extract all input parameters
call isLicensor and isOwner function of contract with userAddr as function parameter
if both are false send message "not owner or licensor" otherwise move forward
decrypt cid with private key, read content from IPFS in buffer
store content file on temprary directory
send file as response and remove file from temporary directory
store transaction hash on database

digitalAssetContract
goal: send digital asset contract ABI(application binary interface) and address
input: none
working:
read ABI and address of digital asset contract from constants JSON
send ABI and address as response

assetContract
goal: send asset contract ABI
input: none
working:
read ABI of asset contract from constants JSON
send ABI as response.

Note: ABI and address are added so that user can interact with contract directly to do transactions
