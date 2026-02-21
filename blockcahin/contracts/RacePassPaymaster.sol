// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RacePassIdentity.sol";

/**
 * @title RacePassPaymaster
 * @dev Sponsers gas for "Tap-to-Enter" ERC4337 transactions IF the user holds a valid 
 * identity and required reputation.
 */
contract RacePassPaymaster is IPaymaster, Ownable {
    RacePassIdentity public identityContract;
    
    // The EntryPoint contract logic
    address public immutable entryPoint;
    
    // The amount of reputation required to get free gas
    uint256 public requiredReputationForSponsorship;

    constructor(address _entryPoint, address _identityAddress, uint256 _requiredRep) Ownable(msg.sender) {
        entryPoint = _entryPoint;
        identityContract = RacePassIdentity(_identityAddress);
        requiredReputationForSponsorship = _requiredRep;
    }

    /**
     * Validate the Paymaster user operation
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == entryPoint, "Paymaster: caller is not the EntryPoint");
        (userOpHash);
        (maxCost);

        // Extract the sender of the UserOperation
        address sender = userOp.sender;

        // Verify sender has valid identity and enough rep points (Tire Wear mechanism)
        // Note: For real world we might only require `requireAge18 = false` to sponsor
        // normal entry, depending on the event configuration.
        bool eligible = identityContract.checkEligibility(sender, false, requiredReputationForSponsorship);
        
        // Return 0 if eligible (SigTimeRange validation data ok), else 1 to drop
        if (eligible) {
            return ("", 0); // Validation success, sponsor gas
        } else {
            return ("", 1); // Validation failed, do not sponsor
        }
    }

    /**
     * Post-Operation hook
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override {
        // Here we could implement "Reputation Tire Wear": deduct 1 rep score for each sponsored transaction
        // But for "Tap-to-Enter", we'll just allow free entry
        (mode);
        (context);
        (actualGasCost);
        (actualUserOpFeePerGas);
    }
}
