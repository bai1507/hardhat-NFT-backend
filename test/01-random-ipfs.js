const { network, getNamedAccounts,deployments,ethers } = require("hardhat");
const { assert, expect } = require("chai");
const {networkConfig,} = require("../helper-hardhat-config");


let tokenUris = [
    'ipfs://QmQN2bj6RQMDCfgPzZvZRxUgwFWykqMthDdFjQ7wLCTJid',
    'ipfs://QmcrQCMi4czD7SNbMGRora8zRuZei4nWYcEjeNLA5aGaWN',
    'ipfs://QmU8jHDGuLBkdkNxrH1Jb1FQCgZsJ6evwXRYmXvDRBkHqC'
  ];
describe("random IPFS Unit Test", function () {
    let randomIpfsNFT,vrfCoordinatorV2Mock
    before(async () => {
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();
        await deployments.fixture(["mocks", "randomipfs"])
        randomIpfsNFT = await ethers.getContract("randomIpfsNft")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        
        console.log(`mock deployed...${vrfCoordinatorV2Mock.address}`);
        console.log(`random deployed...${randomIpfsNFT.address}`);

      });
    it("constructor",async ()=>{
        
    })
    describe("testing requestNFT to get random words",function(){
        let requestId;
        it("requestNFT testing mintFee equal to value",async ()=>{
            const fee = ethers.utils.parseEther("0.001");
            await expect(randomIpfsNFT.requestNFT({value:fee.toString()})).to.be.revertedWith("need more ETH sent");
        })
        it("requestNFT testing:get requestId",async ()=>{
            const sendValue = ethers.utils.parseEther("0.1");
            const randomReponse =  await randomIpfsNFT.requestNFT({value:sendValue})
            const requestReceipt = await randomReponse.wait(1)
            requestId = requestReceipt.events[1].args.requestId.toString()
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId,randomIpfsNFT.address)
        })
        it("requestNFT testing: emit an event ",async ()=>{
            const fee = await randomIpfsNFT.getMintFee()
            await expect(randomIpfsNFT.requestNFT({ value: fee.toString() })).to.emit(
                randomIpfsNFT,
                "NftRequested"
            )
        })
    })
    describe("getBreedFromModdedRng", () => {
        //0:pug 1:shiba 2:st
        it("getBreedFromModdedRng pug: if moddedRng<10",async()=>{
           const BreedReponse =  await randomIpfsNFT.getBreedFromModdedRng(7)
           assert.equal(0, BreedReponse) 

        })
        it("getBreedFromModdedRng shiba: if 10<=moddedRng<30",async()=>{
            const BreedReponse =  await randomIpfsNFT.getBreedFromModdedRng(10)
            assert.equal(1, BreedReponse)
 
         })
        it("getBreedFromModdedRng ST: if 30<=moddedRng<100",async()=>{
            const BreedReponse =  await randomIpfsNFT.getBreedFromModdedRng(89)
            assert.equal(2, BreedReponse)
 
         })
         it("getBreedFromModdedRng error:out of Bouncd",async()=>{
             await expect(randomIpfsNFT.getBreedFromModdedRng(130)).to.be.revertedWith(
                "randomIpfsNft_RangeOutofBounce"
             )
            
         })
    })
    describe("getFunction testing ",function(){
        it("getTokenUri",async()=>{
            let newTokenUris = []
            for(index in tokenUris){
                const ipfsData =  await randomIpfsNFT.getTokenUri(index);
                newTokenUris.push(ipfsData)
            }
            expect(newTokenUris.toString()).to.equal(tokenUris.toString())
        })
    })
    //requestNFT

    //fulfillRandomWords: uint256 requestId,uint256[] memory randomWords
    //withdraw
})
