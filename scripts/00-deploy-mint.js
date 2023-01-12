const { getNamedAccounts, network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

async function main() {
  const { deployer } = await getNamedAccounts();
  const simpleFactory = await ethers.getContractFactory("simple_NFT", deployer);
  const simpleNFT = await simpleFactory.deploy();
  console.log(`deployed...${simpleNFT.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(simpleNFT.address, null);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
