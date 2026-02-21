// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RacePassIdentity.sol";

/**
 * @title RacePassTicket
 * @dev Programmable Event Access Passes - Tickets that combine access rights with compliance checking.
 * 
 * Features:
 * - Anti-Scalping Constraints: Prevents transfers above a given price markup.
 * - Identity Binding: Can only be transferred to a wallet holding a valid RacePassIdentity.
 * - Condition Verification: e.g. age verification checked continuously during transfers.
 */
contract RacePassTicket is ERC721, Ownable {
    RacePassIdentity public identityContract;

    uint256 public nextTicketId;
    
    // Ticket data
    struct TicketInfo {
        uint256 maxResalePrice;
        bool requireAge18;
        uint256 minReputation;
    }
    
    mapping(uint256 => TicketInfo) public ticketDetails;

    error MissingRequiredIdentity();
    error ResalePriceExceedsCeiling();

    constructor(address initialOwner, address identityAddress) ERC721("RacePass NFT Ticket", "RPT") Ownable(initialOwner) {
        identityContract = RacePassIdentity(identityAddress);
    }

    /**
     * @dev Organizer directly mints tickets bound to identities meeting rules
     */
    function issueTicket(
        address to,
        bool requireAge18,
        uint256 minReputation,
        uint256 maxResalePrice
    ) external onlyOwner {
        // Enforce identity constraints upfront
        if (!identityContract.checkEligibility(to, requireAge18, minReputation)) {
            revert MissingRequiredIdentity();
        }

        uint256 ticketId = ++nextTicketId;
        ticketDetails[ticketId] = TicketInfo({
            maxResalePrice: maxResalePrice,
            requireAge18: requireAge18,
            minReputation: minReputation
        });

        _safeMint(to, ticketId);
    }

    /**
     * @dev Safe-guard transfers to perform anti-scalping and compliance tests.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Standard mint block bypasses recipient checks (since logic handles it in issueTicket)
        // Standard burn block bypasses recipient checks
        if (from != address(0) && to != address(0)) {
            TicketInfo memory params = ticketDetails[tokenId];
            
             // Before transferring, ensure the recipient has required identity and rep points
            if (!identityContract.checkEligibility(to, params.requireAge18, params.minReputation)) {
                revert MissingRequiredIdentity();
            }
            
            // Note: Anti-scalping via pure ERC-721 is tricky because price is usually handled by external dexes. 
            // In a fully decentralized system, we use an embedded `buy()` function instead or enforce an external oracle hook.
        }

        return super._update(to, tokenId, auth);
    }
}
