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
    IPool internal _aavePool;
    address internal _treasury;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the bet and transfers the maker's stake to the contract.
    /// @dev Fee-on-transfer and rebasing tokens are not supported.
    /// @param initialBet The initial bet struct
    /// @param pool The Aave V3 pool address
    function initialize(
        IBet.Bet calldata initialBet,
        string calldata description,
        address pool,
        address treasury
    ) external initializer {
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
        _aavePool = IPool(pool);

        // Transfer the funds from the sender to the contract
        IERC20(initialBet.asset).transferFrom(
            initialBet.maker,
            address(this),
            initialBet.makerStake
        );

        // If the pool is set, approve and supply the funds to the pool
        if (pool != address(0)) {
            IERC20(initialBet.asset).approve(pool, type(uint256).max);

            IPool(pool).supply(initialBet.asset, initialBet.makerStake, address(this), 0);
        }

        emit BetCreated(
            initialBet.maker,
            initialBet.taker,
            initialBet.judge,
            initialBet.asset,
            initialBet.acceptBy,
            initialBet.resolveBy,
            initialBet.makerStake,
            initialBet.takerStake,
            description
        );
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev The sender must approve the `address(this)` to spend `bet().asset`. Only callable by the taker.
    function accept() external {
        IBet.Bet memory b = _bet;
        IPool pool = _aavePool;

        // Make sure the bet is pending
        if (_status(b) != IBet.Status.PENDING) {
            revert InvalidStatus();
        }

        // Only the taker can accept the bet
        if (msg.sender != b.taker) {
            revert Unauthorized();
        }

        _bet.status = IBet.Status.ACTIVE;

        // Transfer the funds from the sender to the contract
        IERC20(b.asset).transferFrom(msg.sender, address(this), b.takerStake);

        // If the pool is set, supply the funds to the pool
        if (address(pool) != address(0)) {
            pool.supply(b.asset, b.takerStake, address(this), 0);
        }

        emit BetAccepted();
    }

    function resolve(address winner) external {
        IBet.Bet memory b = _bet;
        IPool pool = _aavePool;

        if (msg.sender != b.judge) {
            revert Unauthorized();
        }

        // Make sure the bet is active
        if (_status(b) != IBet.Status.ACTIVE) {
            revert InvalidStatus();
        }

        // Update the bet
        _bet.winner = winner;
        _bet.status = IBet.Status.RESOLVED;

        uint256 totalWinnings = b.makerStake + b.takerStake;

        // If the funds are in Aave, withdraw them
        if (address(pool) != address(0)) {
            uint256 aTokenBalance = pool.withdraw(
                b.asset,
                type(uint256).max,
                address(this)
            );
            // Cap the winnings to the available balance, in case of negative yield
            totalWinnings = _min(totalWinnings, aTokenBalance);
        }

        // Transfer the winnings to the winner
        IERC20(b.asset).transfer(winner, totalWinnings);

        // Send any yield to treasury, or to the winner if no treasury is set
        _sendRemainder(b.asset, winner);

        emit BetResolved(winner, totalWinnings);
    }

    /// @dev Anybody can cancel an expired bet and send funds back to each party. The maker can cancel a pending bet.
    function cancel() external {
        IBet.Bet memory b = _bet;
        IPool pool = _aavePool;

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

        // Track whether taker deposited (bet was accepted/active)
        bool takerDeposited = b.status == IBet.Status.ACTIVE;

        _bet.status = IBet.Status.CANCELLED;
        uint256 makerRefund = b.makerStake;
        // Only refund taker if they actually deposited
        uint256 takerRefund = takerDeposited ? b.takerStake : 0;

        // If there is a pool, withdraw the funds from Aave first
        if (address(pool) != address(0)) {
            uint256 aTokenBalance = pool.withdraw(
                b.asset,
                type(uint256).max,
                address(this)
            );

            // Cap refunds to available balance (in case of negative yield)
            makerRefund = _min(makerRefund, aTokenBalance);
            takerRefund = _min(takerRefund, aTokenBalance - makerRefund);
        }

        // Transfer the funds back to the maker and taker
        IERC20(b.asset).transfer(b.maker, makerRefund);
        if (takerRefund > 0) {
            IERC20(b.asset).transfer(b.taker, takerRefund);
        }

        // Send any yield to treasury, or to maker if no treasury is set
        _sendRemainder(b.asset, b.maker);

        emit BetCancelled();
    }

    function bet() external view returns (IBet.Bet memory state) {
        state = _bet;
        state.status = _status(state);
    }

    function status() external view returns (IBet.Status) {
        return _status(_bet);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _status(IBet.Bet memory b) internal view returns (IBet.Status s) {
        s = b.status;

        if (
            (s == IBet.Status.PENDING && block.timestamp > b.acceptBy) ||
            (s == IBet.Status.ACTIVE && block.timestamp > b.resolveBy)
        ) {
            s = IBet.Status.EXPIRED;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /// @dev Sends any remaining balance to the treasury, or to the fallback recipient if no treasury is set.
    function _sendRemainder(address asset, address fallbackRecipient) internal {
        uint256 remainder = IERC20(asset).balanceOf(address(this));
        if (remainder > 0) {
            address treasury = _treasury;
            if (treasury == address(0)) {
                IERC20(asset).transfer(fallbackRecipient, remainder);
            } else {
                IERC20(asset).transfer(treasury, remainder);
            }
        }
    }
}
