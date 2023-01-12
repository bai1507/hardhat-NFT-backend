const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {developmentChains,networkConfig,} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const chainID = network.config.chainId;
  let ethUsdPriceFeedAddress;

  if(developmentChains.includes(network.name)){
    const EthUsdAggregator = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = EthUsdAggregator.address;

  }else{
    ethUsdPriceFeedAddress = networkConfig[chainID].ethUsdPriceFeed;
  }
  console.log("😈------------deploying-----------")
  const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg",{encoding:"utf-8"});
  const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg",{encoding:"utf-8"});

  args = [ethUsdPriceFeedAddress,lowSVG,highSVG];
  const dynamicSvgNFT = await deploy("dynamicSvgNft",{
    from:deployer,
    args:args,
    log:true,
    waitConfirmations:network.config.blockConfirmations || 1
  })
   
  console.log("-------------verify--------------");
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying...");
    await verify(dynamicSvgNFT.address, args);
  }

}






module.exports.tags = ["all", "dynamic", "main"]
