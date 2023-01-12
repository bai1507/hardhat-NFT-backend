const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {developmentChains,networkConfig,} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages,storeTokenUriMetadata } = require("../utils/uploadToPinata");
const imageLocation = "./images/randomNFT";
//不同nft的不同属性，你还能自定义其他属性，比如hp,怒气值，等
const metadataTemplate = {
  name:"",
  description:"",
  attributes:[
    {
      trait_type:"cuteness",
      value:100
    }
  ]
} 
let tokenUris = [
  'ipfs://QmQN2bj6RQMDCfgPzZvZRxUgwFWykqMthDdFjQ7wLCTJid',
  'ipfs://QmcrQCMi4czD7SNbMGRora8zRuZei4nWYcEjeNLA5aGaWN',
  'ipfs://QmU8jHDGuLBkdkNxrH1Jb1FQCgZsJ6evwXRYmXvDRBkHqC'
];
const FUND_AMOUNT = ethers.utils.parseEther("10");
module.exports = async function main() {
  const { deploy, log } = deployments;
  const { deployer, player } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Mock, vrfCoordinatorV2address, subscriptionId;

  if(process.env.UPLOAD_TO_PINATA == "true"){
    await handleTokenURIs();
  }
  if (developmentChains.includes(network.name)) {
   
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer);
    //vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", "0x5fbdb2315678afecb367f032d93f642f64180aa3",player)
    // const vrfCoordinatorV2Factory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    // const vrfCoordinatorV2Mock = await vrfCoordinatorV2Factory.deploy();
    vrfCoordinatorV2address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT);
  } else {
    vrfCoordinatorV2address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  console.log("---------------------------");

  const args = [
      vrfCoordinatorV2address,
      subscriptionId,
      networkConfig[chainId].gasLane,
      networkConfig[chainId].callbackGasLimit,
      tokenUris,
      networkConfig[chainId].mintFee
  ]  

  const randomIpfsNFT = await deploy("randomIpfsNft",{
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  })
  if (developmentChains.includes(network.name)) {
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId,randomIpfsNFT.address)

  }

  console.log("-------------verify--------------");
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying...");
    await verify(randomIpfsNFT.address, args);
  }

}

async function handleTokenURIs() {
  tokenUris = [];
  //保存图片到ipfs;
  //将文件图片上传到pinata(ipfs)
  const {responses:imageUploadResponses,files} = await storeImages(imageLocation);
  //保存metadata 在ipfs
  for(imageIndex in imageUploadResponses){
    let tokenUriMetaData = {...metadataTemplate} //javascript语法糖，相当于将metadataTemplate塞进tokenUriMetaData
    //将pinata保存的数据进行处理
    tokenUriMetaData.name = files[imageIndex].replace(".png","");
    tokenUriMetaData.description = `An adorable ${tokenUriMetaData.name} pup!`
    tokenUriMetaData.image = `ipfs://${imageUploadResponses[imageIndex].IpfsHash}`
    console.log(`uploading ${tokenUriMetaData.name}.....`)
    //保存上面处理好的json文件到pinata/ ipfs
    const metadataUpLoadResponse = await storeTokenUriMetadata(tokenUriMetaData)
    tokenUris.push(`ipfs://${metadataUpLoadResponse.IpfsHash}`)
  } 
  console.log("Token URI uploaded success,They are:")
  console.log(tokenUris)
  return tokenUris
}



// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
module.exports.tags = ["all", "randomipfs", "main"]
