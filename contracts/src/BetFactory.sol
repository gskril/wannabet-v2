// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IBet} from "./interfaces/IBet.sol";

contract BetFactory is Ownable2Step {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The implementation contract to clone.
    /// @dev Can be updated by the owner so we don't have to redeploy the factory on every minor change.
    address public betImplementation;

    /// @notice The number of bets created through this factory.
    uint256 public betCount;

    /// @notice Mapping of token addresses to Aave V3 pool addresses.
    mapping(address token => address aavePool) public tokenToPool;

    /// @notice The address where protocol earnings are sent.
    address public treasury;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new bet is created.
    event BetCreated(address indexed bet);

    /// @notice Emitted when the implementation contract is updated.
    event ImplementationUpdated(address indexed newImplementation);

    /// @notice Emitted when the treasury address is updated.
    event TreasuryUpdated(address indexed newTreasury);

    /// @notice Emitted when an Aave pool is configured for a token.
    event PoolConfigured(address indexed token, address indexed pool);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a bet is not found.
    error BetNotFound();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _owner, address _betImplementation) Ownable(_owner) {
        betImplementation = _betImplementation;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Create a new bet.
    /// @return newBet The address of the new bet.
    function createBet(
        address taker,
        address judge,
        address asset,
        uint256 makerStake,
        uint256 takerStake,
        uint40 acceptBy,
        uint40 resolveBy,
        string calldata description
    ) external returns (address newBet) {
        betCount++;
        address pool = tokenToPool[asset];

        newBet = Clones.cloneDeterministic(
            betImplementation,
            keccak256(abi.encode(msg.sender, taker, pool, acceptBy, resolveBy))
        );
        IBet(newBet).initialize(
            IBet.Bet({
                maker: msg.sender,
                acceptBy: acceptBy,
                resolveBy: resolveBy,
                status: IBet.Status.PENDING,
                taker: taker,
                judge: judge,
                asset: asset,
                winner: address(0),
                makerStake: makerStake,
                takerStake: takerStake
            }),
            description,
            pool,
            treasury
        );
        emit BetCreated(newBet);
    }

    /// @notice Get a bet by address.
    function bet(address addr) external view returns (IBet.Bet memory) {
        try IBet(addr).bet() returns (IBet.Bet memory betState) {
            return betState;
        } catch {
            revert BetNotFound();
        }
    }

    /// @notice Get the deterministic address of a bet before it's created.
    /// @dev Useful for batching bet creation, token approval and token transfer.
    function predictBetAddress(
        address maker,
        address taker,
        address aavePool,
        uint40 acceptBy,
        uint40 resolveBy
    ) external view returns (address) {
        return
            Clones.predictDeterministicAddress(
                betImplementation,
                keccak256(abi.encode(maker, taker, aavePool, acceptBy, resolveBy))
            );
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Set the Aave V3 pool address for a token.
    function setPool(address _token, address _pool) external onlyOwner {
        tokenToPool[_token] = _pool;
        emit PoolConfigured(_token, _pool);
    }

    /// @notice Set the treasury address where protocol earnings are sent.
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /// @notice Update the implementation contract.
    /// @dev Should only be used with minor changes.
    function updateImplementation(address _betImplementation) external onlyOwner {
        betImplementation = _betImplementation;
        emit ImplementationUpdated(_betImplementation);
    }
}
