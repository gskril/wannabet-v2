// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IBet {
    enum Status {
        PENDING,
        ACTIVE,
        RESOLVED,
        CANCELLED,
        EXPIRED
    }

    struct Bet {
        // Slot 0: packs all these together (160 + 40 + 40 + 8 = 248 bits)
        address maker;
        uint40 acceptBy;
        uint40 resolveBy;
        Status status;
        // Each of these will take their own slot (addresses don’t pack with each other)
        address taker; // Slot 1
        address judge; // Slot 2
        address asset; // Slot 3
        address winner; // Slot 4
        // Each uint256 consumes a full slot
        // TODO: I feel like there's a more efficient way to represent the maker:taker ratio
        uint256 makerStake; // Slot 5
        uint256 takerStake; // Slot 6
    }

    function bet() external view returns (Bet memory);

    function initialize(IBet.Bet memory initialBet) external;
}
