// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAToken} from "@aave/v3/interfaces/IAToken.sol";
import {IPool} from "@aave/v3/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/v3/interfaces/IPoolAddressesProvider.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IBet} from "./interfaces/IBet.sol";

contract BetFactory is Ownable2Step {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The Aave V3 pool address provider on Base Mainnet.
    IPoolAddressesProvider public constant AAVE_ADDRESSES_PROVIDER =
        IPoolAddressesProvider(0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D);

    /// @notice The number of bets created through this factory.
    uint256 public betCount;

    /// @notice The implementation contract to clone.
    /// @dev Can be updated by the owner so we don't have to redeploy the factory on every minor change.
    address public betImplementation;

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

    /// @notice Thrown when a bet is not found.
    error BetNotFound();

    /// @notice Thrown when an Aave V3 pool is not valid.
    error InvalidPool();

    /// @notice Thrown when a token is not supported by Aave V3.
    error TokenNotSupported();

    /// @notice Thrown when a token and its corresponding Aave V3 AToken are not correctly paired.
    error ATokenMismatch();

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
    /// @dev Fee-on-transfer and rebasing tokens are not supported.
    /// @return newBet The address of the new bet.
    function createBet(
        address taker,
        address judge,
        address asset,
        uint256 makerStake,
        uint256 takerStake,
        uint40 acceptBy,
        uint40 endsBy,
        string calldata description
    ) external returns (address newBet) {
        betCount++;
        address pool = tokenToPool[asset];

        newBet = Clones.cloneDeterministic(
            betImplementation,
            keccak256(abi.encode(msg.sender, taker, acceptBy, endsBy))
        );
        IBet(newBet).initialize(
            IBet.Bet({
                maker: msg.sender,
                acceptBy: acceptBy,
                endsBy: endsBy,
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
        uint40 acceptBy,
        uint40 endsBy
    ) external view returns (address) {
        return
            Clones.predictDeterministicAddress(
                betImplementation,
                keccak256(abi.encode(maker, taker, acceptBy, endsBy))
            );
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Set the Aave V3 pool address for a token.
    function setPool(address _token, address _pool) external onlyOwner {
        // Allow setting to zero (disable Aave deposits)
        if (_pool == address(0)) {
            tokenToPool[_token] = address(0);
            emit PoolConfigured(_token, address(0));
            return;
        }

        // Validate against canonical registry
        if (_pool != AAVE_ADDRESSES_PROVIDER.getPool()) {
            revert InvalidPool();
        }

        // Verify token is listed
        address aToken = IPool(_pool).getReserveAToken(_token);
        if (aToken == address(0)) {
            revert TokenNotSupported();
        }

        // Verify bidirectional relationship (AToken -> Token and Token -> AToken)
        if (IAToken(aToken).UNDERLYING_ASSET_ADDRESS() != _token) {
            revert ATokenMismatch();
        }

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
