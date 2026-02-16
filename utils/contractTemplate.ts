
/**
 * UI表示およびコンソールログ出力用のSolidityソースコード定数
 * NOTE: contracts/MiningQuestReward.sol と同期させる必要があります。
 */
export const MINING_QUEST_REWARD_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiningQuestReward is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct QuestConfig {
        uint256 minReward;
        uint256 maxReward;
        bool exists;
    }

    IERC20 public immutable rewardToken;
    address public constant signerAddress = 0xB6eDacfc0dFc759E9AC5b9b8B6eB32310ac1Bb49;
    
    mapping(uint256 => QuestConfig) public questConfigs;
    mapping(uint256 => mapping(uint256 => bool)) public claimedQuests;
    mapping(uint256 => uint256) public totalClaimedPerUser;

    event RewardClaimed(uint256 indexed fid, uint256 indexed questPid, uint256 questId, uint256 amount);

    constructor() Ownable(msg.sender) {
        rewardToken = IERC20(0xb0525542E3D818460546332e76E511562dFf9B07);
        _transferOwnership(0x9eB566Cc59e3e9D42209Dd2d832740a6A74f5F23);
        
        _setQuestConfig(1, 2, 200);
        _setQuestConfig(2, 5, 500);
        _setQuestConfig(3, 10, 1200);
        _setQuestConfig(4, 30, 3000);
        _setQuestConfig(5, 80, 8000);
    }

    function _setQuestConfig(uint256 id, uint256 min, uint256 max) internal {
        questConfigs[id] = QuestConfig(min, max, true);
    }

    function updateQuestConfig(uint256 id, uint256 min, uint256 max) external onlyOwner {
        _setQuestConfig(id, min, max);
    }

    function claimReward(
        uint256 fid,
        uint256 questPid,
        uint256 questId,
        uint256 amount,
        uint256 totalReward,
        bytes calldata signature
    ) external nonReentrant {
        require(!claimedQuests[fid][questPid], "Quest PID already claimed");

        QuestConfig memory config = questConfigs[questId];
        require(config.exists, "Invalid Quest ID");
        require(amount >= config.minReward, "Amount below min_reward");
        require(amount <= config.maxReward, "Amount exceeds max_reward");

        require(amount <= totalReward, "Amount exceeds total_reward stats");
        require(totalClaimedPerUser[fid] + amount <= totalReward, "Cumulative reward exceeds limit");

        bytes32 messageHash = keccak256(abi.encodePacked(
            fid,
            questPid,
            questId,
            amount,
            totalReward,
            address(this)
        ));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == signerAddress, "Invalid server signature");

        claimedQuests[fid][questPid] = true;
        totalClaimedPerUser[fid] += amount;

        uint256 amountWei = amount * 10**18;
        require(rewardToken.balanceOf(address(this)) >= amountWei, "Contract balance insufficient");
        
        bool success = rewardToken.transfer(msg.sender, amountWei);
        require(success, "Token transfer failed");

        emit RewardClaimed(fid, questPid, questId, amountWei);
    }
}`;
