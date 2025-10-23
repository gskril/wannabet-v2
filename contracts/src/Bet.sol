// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IPool} from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol";

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
    IPool internal aavePool;
    address internal _treasury;

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
    event Deposited(address indexed depositor, uint256 amount);
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
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the bet
    /// @param initialBet The initial bet struct
    /// @param pool The Aave V3 pool address
    function initialize(
        IBet.Bet calldata initialBet,
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
        aavePool = IPool(pool);

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

    /// @dev The sender must approve the `address(this)` to spend `bet().asset`
    function deposit(uint256 amount) external {
        IBet.Bet memory b = _bet;

        // Make sure the bet is pending
        if (b.status != IBet.Status.PENDING) {
            revert InvalidStatus();
        }

        // Only the maker or taker can deposit
        if (msg.sender != b.maker && msg.sender != b.taker) {
            revert Unauthorized();
        }

        // Make sure the amount matches the bet stake
        if (
            msg.sender == b.maker
                ? amount != b.makerStake
                : amount != b.takerStake
        ) {
            revert InvalidAmount();
        }

        // Transfer the funds from the sender to the contract
        // Skip ?
        IERC20(b.asset).transferFrom(msg.sender, address(this), amount);

        // If the pool is set, supply the funds to the pool
        if (address(aavePool) != address(0)) {
            aavePool.supply(b.asset, amount, address(this), 0);
        }

        // If both sides have deposited, the bet is active
        if (
            IERC20(b.asset).balanceOf(address(this)) ==
            b.makerStake + b.takerStake
        ) {
            _bet.status = IBet.Status.ACTIVE;
        }

        emit Deposited(msg.sender, amount);
    }

    function resolveBet(address winner) external {
        IBet.Bet memory b = _bet;

        if (msg.sender == b.judge) {
            revert Unauthorized();
        }

        // Make sure the bet is active
        if (b.status != IBet.Status.ACTIVE || block.timestamp > b.resolveBy) {
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

        // Transfer the fees to the treasury
        IERC20(b.asset).transfer(_treasury, (totalWinnings * 100) / 1000);

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
}
