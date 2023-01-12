// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
error randomIpfsNft_RangeOutofBounce();

contract randomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //nft种类
    enum Breed {
        PUG,
        SHIBA,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    //vrf helpers
    mapping(uint256 => address) public s_requesIdToSender;
    //nft的tokenid
    uint256 private s_tokenCounter;
    uint256 private constant MAX_CHANCE_VALUE = 100;
    string[] private s_tokenUri;
    uint256 private i_mintFee;

    //event:
    event NftRequested(uint256 indexed requestId, address indexed requester);
    event Nftminted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("kuDog", "KD") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_tokenUri = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNFT() public payable returns (uint256 requestId) {
        require(msg.value >= i_mintFee, "need more ETH sent");
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requesIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address dogOwner = s_requesIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter += 1;
        //
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;

        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenUri[uint256(dogBreed)]);
        emit Nftminted(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "transfer failed");
    }

    function getBreedFromModdedRng(
        uint256 moddedRng
    ) public pure returns (Breed) {
        uint256 cumulationSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        //如果moddedRng ：7 满足：7>=0 && 7< 10 :所以是pug
        //如果moddedRng :10 满足：10>=10 && 10 <  30 :所以是shiba
        //如果moddedRng :40 满足：40>=30 $$ 40 <  100 :所以是ST_BERNARD

        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulationSum &&
                moddedRng <  chanceArray[i]
            ) {
                return Breed(i);
            }
            cumulationSum += chanceArray[i];
        }
        revert randomIpfsNft_RangeOutofBounce();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        //索引0表示有10%
        //索引1表示有30-10=20%
        //索引2表示有100-（30+10）=60%
        return [10, 30, MAX_CHANCE_VALUE];
    }

    // uint256 private s_tokenCounter;
    // uint256 private constant MAX_CHANCE_VALUE = 100;
    // string[] private s_tokenUri;
    // uint256 private i_mintFee;

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getTokenUri(uint256 _index) public view returns (string memory) {
        return s_tokenUri[_index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
