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
        address maker;
        uint40 acceptBy;
        uint40 resolveBy;
        Status status;
        address taker;
        address judge;
        address asset;
        address winner;
        uint256 makerStake;
        uint256 takerStake;
    }

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event BetCreated(
        address indexed maker,
        address indexed taker,
        address indexed judge,
        address asset,
        uint40 acceptBy,
        uint40 resolveBy,
        uint256 makerStake,
        uint256 takerStake,
        string description
    );
    event BetAccepted();
    event BetResolved(address indexed winner, uint256 amount);
    event BetCancelled();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidStatus();
    error InvalidTimestamp();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function initialize(
        IBet.Bet calldata initialBet,
        string calldata description,
        address pool,
        address treasury
    ) external;

    function accept() external;

    function resolve(address winner) external;

    function cancel() external;

    function bet() external view returns (Bet memory);
}
