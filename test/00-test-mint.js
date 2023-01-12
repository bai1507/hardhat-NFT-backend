const { network, getNamedAccounts, ethers } = require("hardhat");
const { assert, expect } = require("chai");

describe("simple ERC721 Unit Test", function () {
  let simpleFactory, simpleNFT;
  before(async () => {
    const { deployer } = await getNamedAccounts();
    simpleFactory = await ethers.getContractFactory("simple_NFT", deployer);
    simpleNFT = await simpleFactory.deploy();
    console.log(`deployed...${simpleNFT.address}`);
  });
  it("check constructor ERC721 name&symbol", async () => {
    const name = await simpleNFT.name();
    const symbol = await simpleNFT.symbol();
    expect(name.toString() + symbol.toString()).to.equal("kuDog" + "KD");
  });
  describe("main function testing", async () => {
    it("testing mint function", async () => {
      const mintTx = await simpleNFT.mintNFT();
      await mintTx.wait(1);
      const { deployer } = await getNamedAccounts();
      const deployerBalance = await simpleNFT.balanceOf(deployer);
      expect(deployerBalance.toString()).to.equal("1");
      //tokenId 从0开始
      const owner = await simpleNFT.ownerOf("0");
      assert.equal(owner, deployer);
    });
  });
});
