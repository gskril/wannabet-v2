// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

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
    event BetResolved(address indexed winner, uint256 makerWinnings);
    event BetCancelled();

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidTimestamp();
    error InvalidStatus();
    error Unauthorized();

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

        IERC20(initialBet.asset).transferFrom(
            initialBet.maker,
            address(this),
            initialBet.makerStake
        );

        _bet = initialBet;

        emit BetCreated(
            initialBet.maker,
            initialBet.taker,
            initialBet.asset,
            initialBet.acceptBy,
            initialBet.resolveBy,
            initialBet.makerStake,
            initialBet.takerStake
        );
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function bet() external view returns (IBet.Bet memory state) {
        state = _bet;
        state.status = _status(state);
        return state;
    }

    /// @dev Caller needs to have approved at least `_bit.takerStake` of token `_bit.asset`
    /// I think there's a more efficient way to load _bet here since it's used multiple times
    function acceptBet() external {
        if (msg.sender == _bet.taker) {
            revert Unauthorized();
        }

        // Collect the taker's stake
        IERC20(_bet.asset).transferFrom(
            msg.sender,
            address(this),
            _bet.takerStake
        );

        emit BetAccepted();
    }

    function resolveBet(address winner) external {
        if (msg.sender == _bet.judge) {
            revert Unauthorized();
        }

        // Make sure the bet is active
        if (
            _bet.status != IBet.Status.ACTIVE ||
            block.timestamp > _bet.resolveBy
        ) {
            revert InvalidStatus();
        }

        uint256 totalWinnings = _bet.makerStake + _bet.takerStake;
        emit BetResolved(winner, totalWinnings);

        // Transfer the winnings to the winner
        IERC20(_bet.asset).transfer(winner, totalWinnings);

        // Update the bet struct
        _bet.winner = winner;
        _bet.status = IBet.Status.RESOLVED;
    }

    /// @dev Any address can cancel the bet if it's expired and sent funds back to each party
    function cancelBet() external {
        // Can't cancel a bet that's already been resolved or cancelled
        if (_bet.status >= IBet.Status.RESOLVED) {
            revert InvalidStatus();
        }

        // TODO: Can't cancel a bet that's not expired

        // Transfer the funds back to the maker and taker
        IERC20(_bet.asset).transfer(_bet.maker, _bet.makerStake);
        IERC20(_bet.asset).transfer(_bet.taker, _bet.takerStake);

        // Update the bet struct
        _bet.status = IBet.Status.CANCELLED;
        emit BetCancelled();
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
