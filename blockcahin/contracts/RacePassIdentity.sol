// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RacePassIdentity
 * @dev Universal Soulbound Identity layer with dynamic reputation decay.
 */
contract RacePassIdentity is ERC721, Ownable {
    // Identity structurally verified attributes
    struct IdentityAttributes {
        bool isKycVerified;
        bool isOver18;
        uint256 baseReputationScore;
        uint256 lastUpdateTimestamp;
        bool isRevoked;
    }

    uint256 private _nextTokenId;
    
    // Mapping from user address to their Soulbound Identity Token ID
    mapping(address => uint256) public userToTokenId;
    
    // Mapping from Token ID to Attributes
    mapping(uint256 => IdentityAttributes) public identityData;
    
    // Trusted Verifier (e.g. ZKP verifier contract or offchain oracle)
    address public trustedVerifier;

    // Reputation decays by 1 point per day
    uint256 public constant DECAY_RATE_PER_DAY = 1;

    error AlreadyHasIdentity();
    error NotTrustedVerifier();
    error SoulboundTokenCannotBeTransferred();
    error IdentityRevoked();

    event IdentityIssued(address indexed user, uint256 tokenId);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore, string reason);

    constructor(address initialOwner) ERC721("RacePass Identity", "RP-ID") Ownable(initialOwner) {
        trustedVerifier = initialOwner;
    }

    function setTrustedVerifier(address _verifier) external onlyOwner {
        trustedVerifier = _verifier;
    }

    /**
     * @dev Mint a new Identity SBT. Triggered after successful ZK proof verification.
     */
    function issueIdentity(
        address to,
        bool isKycVerified,
        bool isOver18,
        uint256 initialReputation
    ) external {
        if (msg.sender != trustedVerifier && msg.sender != owner()) {
            revert NotTrustedVerifier();
        }
        if (userToTokenId[to] != 0) {
            revert AlreadyHasIdentity();
        }

        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        
        userToTokenId[to] = tokenId;
        identityData[tokenId] = IdentityAttributes({
            isKycVerified: isKycVerified,
            isOver18: isOver18,
            baseReputationScore: initialReputation,
            lastUpdateTimestamp: block.timestamp,
            isRevoked: false
        });

        emit IdentityIssued(to, tokenId);
    }

    function addReputation(uint256 tokenId, uint256 amount, string calldata reason) external {
        if (msg.sender != trustedVerifier && msg.sender != owner()) {
            revert NotTrustedVerifier();
        }
        
        uint256 currentScore = getActiveReputation(tokenId);
        identityData[tokenId].baseReputationScore = currentScore + amount;
        identityData[tokenId].lastUpdateTimestamp = block.timestamp;
        
        emit ReputationUpdated(tokenId, identityData[tokenId].baseReputationScore, reason);
    }

    function deductReputation(uint256 tokenId, uint256 amount, string calldata reason) external {
        if (msg.sender != trustedVerifier && msg.sender != owner()) {
            revert NotTrustedVerifier();
        }
        
        uint256 currentScore = getActiveReputation(tokenId);
        uint256 newScore = 0;
        if (currentScore > amount) {
            newScore = currentScore - amount;
        }

        identityData[tokenId].baseReputationScore = newScore;
        identityData[tokenId].lastUpdateTimestamp = block.timestamp;
        
        emit ReputationUpdated(tokenId, newScore, reason);
    }

    function revokeIdentity(uint256 tokenId, bool status) external onlyOwner {
        identityData[tokenId].isRevoked = status;
    }

    /**
     * @dev Calculates current reputation factoring in time decay (Tire Wear).
     */
    function getActiveReputation(uint256 tokenId) public view returns (uint256) {
        IdentityAttributes memory attrs = identityData[tokenId];
        if (attrs.lastUpdateTimestamp == 0) return 0;
        
        uint256 daysPassed = (block.timestamp - attrs.lastUpdateTimestamp) / 1 days;
        uint256 decayAmount = daysPassed * DECAY_RATE_PER_DAY;
        
        if (decayAmount >= attrs.baseReputationScore) {
            return 0; // Reputation hit rock bottom due to inactivity
        }
        
        return attrs.baseReputationScore - decayAmount;
    }

    function hasValidIdentity(address user) external view returns (bool) {
        return userToTokenId[user] != 0;
    }

    function checkEligibility(address user, bool requireAge18, uint256 minReputation) external view returns (bool) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return false;
        
        IdentityAttributes memory attrs = identityData[tokenId];
        if (attrs.isRevoked) return false;
        
        if (requireAge18 && !attrs.isOver18) return false;
        if (getActiveReputation(tokenId) < minReputation) return false;
        
        return true;
    }

    // Prevents transfers to make it Soulbound
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }
        return super._update(to, tokenId, auth);
    }
}
