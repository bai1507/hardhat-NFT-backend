const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {developmentChains,networkConfig,} = require("../helper-hardhat-config");

module.exports = async function main(){
    const {deployer} = await getNamedAccounts();

    //basic NFT 
    // const simpleNFT =  await ethers.getContract("simple_NFT",deployer);
    // const simpleResponse= await simpleNFT.mintNFT();
    // await simpleResponse.wait(1);
    // console.log(`Basic NFT index 0 has tokenURI:${await simpleNFT.tokenURI(0)}`);

    //random NFT
    const randomIpfsNft =  await ethers.getContract("randomIpfsNft",deployer);
    const mintFee = await randomIpfsNft.getMintFee();

    
    const randomIpfsNFTTx = await randomIpfsNft.requestNFT({
        value:mintFee.toString(),
        gasPrice:1400000000,
        gasLimit:100000
     })
    const randomIpfsNFTTxReceipt =await randomIpfsNFTTx.wait(1);
    const { gasUsed, effectiveGasPrice } = randomIpfsNFTTxReceipt;
    const gasCost = gasUsed.mul(effectiveGasPrice);
    console.log(gasCost.toString());
    console.log(gasUsed.toString())
    await new Promise(async(resolve,reject)=>{
        setTimeout(resolve,300000); //5minutes
        randomIpfsNft.once("Nftminted",async function(){
            resolve();
        })
       
        if(developmentChains.includes(network.name)){
            const requestId = randomIpfsNFTTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer);
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId,randomIpfsNft.address);
        }
    })
    console.log(`Random NFT index 0 tokenURI:${await randomIpfsNft.tokenURI(0)}`)


    //dynamic NFT
    // const highValue = ethers.utils.parseEther("111");
    // const dynamicSvgNFT =  await ethers.getContract("dynamicSvgNft",deployer);
    // const dynamicTx= await dynamicSvgNFT.minNft(highValue);
    // const txReceipt= await dynamicTx.wait(1);
    // const tokenId = txReceipt.events[1].args.tokenId.toString();
    // console.log(`dynamic NFT index 0 tokenURI:${await dynamicSvgNFT.tokenURI(tokenId)}`)


}

module.exports.tags = ["all","mint"];