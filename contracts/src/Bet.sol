// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {IBet} from "./interfaces/IBet.sol";

contract Bet is IBet, Initializable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IBet.Bet internal _bet;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidTimestamp();
    error InvalidStatus();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    function initialize(IBet.Bet calldata initialBet) external initializer {
        // Make sure maker, taker, asset, and judge are not the zero address
        if (
            initialBet.maker == address(0) ||
            initialBet.taker == address(0) ||
            initialBet.asset == address(0) ||
            initialBet.judge == address(0)
        ) {
            revert InvalidAddress();
        }

        // Make sure acceptBy is in the future, and resolveBy is after acceptBy
        uint40 acceptBy = initialBet.acceptBy;
        if (acceptBy <= block.timestamp || initialBet.resolveBy <= acceptBy) {
            revert InvalidTimestamp();
        }

        // Make sure status is PENDING
        if (initialBet.status != IBet.Status.PENDING) {
            revert InvalidStatus();
        }

        _bet = initialBet;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function bet() external view returns (IBet.Bet memory state) {
        state = _bet;
        state.status = _status(state);
        return state;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _status(IBet.Bet memory b) internal view returns (IBet.Status) {
        IBet.Status s = b.status;

        if (
            (s == IBet.Status.PENDING && block.timestamp > b.acceptBy) ||
            (s == IBet.Status.ACTIVE && block.timestamp > b.resolveBy)
        ) {
            return IBet.Status.EXPIRED;
        }

        return s;
    }

    /*//////////////////////////////////////////////////////////////
                           REQUIRED OVERRIDES
    //////////////////////////////////////////////////////////////*/
}
