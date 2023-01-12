const { deployments,getNamedAccounts, network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function main() {
  const { deploy} = deployments;
  const { deployer } = await getNamedAccounts();
  // const simpleFactory = await ethers.getContractFactory("simple_NFT", deployer);
  // const simpleNFT = await simpleFactory.deploy();
  const simpleNFT = await deploy("simple_NFT", {
    from: deployer,
    log: true
  })
  console.log(`deployed...${simpleNFT.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...");
    await verify(simpleNFT.address, null);
  }
}




module.exports.tags = ["all", "basic", "main"]
