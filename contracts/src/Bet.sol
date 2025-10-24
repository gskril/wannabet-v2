// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IPool} from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol";

import {IBet} from "./interfaces/IBet.sol";

contract Bet is IBet, Initializable {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IBet.Bet internal _bet;
    IPool internal aavePool;
    address internal _treasury;

    // Temporary allowlist to prevent real people from losing money lol
    mapping(address => bool) internal _allowed;

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the bet and transfers the maker's stake to the contract
    /// @param initialBet The initial bet struct
    /// @param pool The Aave V3 pool address
    function initialize(
        IBet.Bet calldata initialBet,
        address pool,
        address treasury
    ) external initializer {
        _allowed[0xA7860E99e3ce0752D1ac53b974E309fFf80277C6] = true; // limes.eth
        _allowed[0xd37aBf24c89BB36DB9363DA3a304a254488e1E02] = true; // limes farcaster
        _allowed[0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF] = true; // slobo.eth
        _allowed[0x2aEc130Ec5156132fbB348292A90cb2f3De8A782] = true; // slobo farcaster
        _allowed[0x179A862703a4adfb29896552DF9e307980D19285] = true; // gregskril.eth
        _allowed[0x716B52795a72DE3309D86971428e19843D6D9A81] = true; // greg farcaster

        // Only allowlisted addresses can create bets for testing
        if (!_allowed[initialBet.maker]) {
            revert Unauthorized();
        }

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
        _treasury = treasury;
        aavePool = IPool(pool);

        // Transfer the funds from the sender to the contract
        // Maybe can skip this and send it striaght to Aave ?
        IERC20(initialBet.asset).transferFrom(
            initialBet.maker,
            address(this),
            initialBet.makerStake
        );

        // If the pool is set, supply the funds to the pool
        if (pool != address(0)) {
            aavePool.supply(
                initialBet.asset,
                initialBet.makerStake,
                address(this),
                0
            );
        }

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

    /// @dev The sender must approve the `address(this)` to spend `bet().asset`. Only callable by the taker.
    function accept() external {
        IBet.Bet memory b = _bet;

        // Make sure the bet is pending
        if (_status(b) != IBet.Status.PENDING) {
            revert InvalidStatus();
        }

        // Only the taker can accept the bet
        if (msg.sender != b.taker) {
            revert Unauthorized();
        }

        // Transfer the funds from the sender to the contract
        // Skip ?
        IERC20(b.asset).transferFrom(msg.sender, address(this), b.takerStake);

        // If the pool is set, supply the funds to the pool
        if (address(aavePool) != address(0)) {
            aavePool.supply(b.asset, b.takerStake, address(this), 0);
        }

        _bet.status = IBet.Status.ACTIVE;
        emit BetAccepted();
    }

    function resolve(address winner) external {
        IBet.Bet memory b = _bet;

        if (msg.sender != b.judge) {
            revert Unauthorized();
        }

        // Make sure the bet is active
        if (_status(b) != IBet.Status.ACTIVE || block.timestamp > b.resolveBy) {
            revert InvalidStatus();
        }

        uint256 totalWinnings = b.makerStake + b.takerStake;
        emit BetResolved(winner, totalWinnings);

        // If the funds are in Aave, withdraw them
        if (address(aavePool) != address(0)) {
            aavePool.withdraw(b.asset, totalWinnings, address(this));
        }

        // Transfer the winnings to the winner
        IERC20(b.asset).transfer(winner, totalWinnings);

        // Transfer the remainder to the treasury
        uint256 remainder = IERC20(b.asset).balanceOf(address(this));
        if (remainder > 0) {
            IERC20(b.asset).transfer(_treasury, remainder);
        }

        // Update the bet
        _bet.winner = winner;
        _bet.status = IBet.Status.RESOLVED;
    }

    /// @dev Anybody can cancel an expired bet and send funds back to each party. The maker can cancel a pending bet.
    function cancel() external {
        IBet.Bet memory b = _bet;

        // Can't cancel a bet that's already completed
        if (b.status >= IBet.Status.RESOLVED) {
            revert InvalidStatus();
        } else {
            // Pending or active bets at this point
            // The maker can cancel a pending bet, so block them from cancelling an active bet
            if (b.maker == msg.sender && b.status != IBet.Status.PENDING) {
                revert InvalidStatus();
            }
        }

        // Transfer the funds back to the maker and taker
        // We don't track which party has deposited, so we can try/catch both transfers starting with the maker
        try IERC20(b.asset).transfer(b.maker, b.makerStake) {} catch {}
        try IERC20(b.asset).transfer(b.taker, b.takerStake) {} catch {}

        // Update the bet struct
        _bet.status = IBet.Status.CANCELLED;
        emit BetCancelled();
    }

    function bet() external view returns (IBet.Bet memory state) {
        state = _bet;
        state.status = _status(state);
        return state;
    }

    function status() external view returns (IBet.Status) {
        return _status(_bet);
    }

    function balanceOfAsset() external view returns (uint256) {
        return IERC20(_bet.asset).balanceOf(address(this));
    }

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
}
