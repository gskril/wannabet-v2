// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IBet} from "./interfaces/IBet.sol";

contract BetFactory is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The name of the contract.
    string public constant name = "BetFactory";

    /// @notice The implementation contract to clone
    /// @dev Can be changed by the owner so we don't have to redeploy the factory
    address public immutable betImplementation;

    /// @notice The bet count
    uint256 public betCount;

    /// @notice Mapping of token addresses to Aave V3 pool addresses
    mapping(address => address) public tokenToPool;

    address public treasury;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new bet is created
    event BetCreated(address indexed bet);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a bet is not found
    error BetNotFound();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _owner, address _betImplementation) Ownable(_owner) {
        betImplementation = _betImplementation;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // receive() external payable {}

    /// @notice Creates a new bet
    /// @return The address of the new bet
    function createBet(
        address taker,
        address judge,
        address asset,
        uint256 makerStake,
        uint256 takerStake,
        uint40 acceptBy,
        uint40 resolveBy
    ) external returns (address) {
        betCount++;
        address newBet = Clones.clone(betImplementation);
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
            tokenToPool[asset],
            treasury
        );
        emit BetCreated(newBet);
        return newBet;
    }

    /// @notice Gets a bet by address
    function bet(address addr) external view returns (IBet.Bet memory) {
        try IBet(addr).bet() returns (IBet.Bet memory betState) {
            return betState;
        } catch {
            revert BetNotFound();
        }
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets the Aave V3 pool address for a token
    function setPool(address token, address pool) external onlyOwner {
        tokenToPool[token] = pool;
    }

    /// @notice Sets the treasury address
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                           REQUIRED OVERRIDES
    //////////////////////////////////////////////////////////////*/
}
