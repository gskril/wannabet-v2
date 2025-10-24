// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IBet {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

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

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event BetCreated(
        address indexed maker,
        address indexed taker,
        address indexed asset,
        uint40 acceptBy,
        uint40 resolveBy,
        uint256 makerStake,
        uint256 takerStake
    );
    event BetAccepted();
    event BetResolved(address indexed winner, uint256 amount);
    event BetCancelled();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidAmount();
    error InvalidStatus();
    error InvalidTimestamp();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function initialize(
        IBet.Bet memory initialBet,
        address pool,
        address treasury
    ) external;

    function accept() external;

    function resolve(address winner) external;

    function cancel() external;

    function bet() external view returns (Bet memory);
}
