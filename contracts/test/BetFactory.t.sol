// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {Bet} from "../src/Bet.sol";
import {BetFactory} from "../src/BetFactory.sol";
import {IBet} from "../src/interfaces/IBet.sol";

contract BetFactoryTest is Test {
    BetFactory betFactory;
    // address maker = makeAddr("maker");
    address maker = 0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF; // slobo
    address taker = makeAddr("taker");
    address owner = makeAddr("owner");
    IERC20 usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);

    function setUp() public {
        // Run everything on a fork of Base
        vm.createSelectFork("https://base-rpc.publicnode.com");

        // Mint some USDC to the maker
        vm.prank(0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB); // aUSDC token which holds all the underlying USDC
        usdc.transfer(maker, 1000 * 1e6);

        Bet betImplementation = new Bet();
        betFactory = new BetFactory(owner, address(betImplementation));
    }

    function test_Name() public view {
        assertEq(betFactory.name(), "BetFactory");
    }

    function test_ForkAndPrank() public view {
        assertEq(block.chainid, 8453);
        assertGt(IERC20(usdc).balanceOf(maker), 1000000000);
    }

    function test_CreateBetWithNoPool() public {
        vm.prank(maker);
        IBet bet = IBet(
            betFactory.createBet(
                makeAddr("taker"), // taker
                makeAddr("judge"), // judge
                address(usdc), // asset
                1000000000000000000, // makerStake
                1000000000000000000, // takerStake
                uint40(block.timestamp + 1000), // acceptBy
                uint40(block.timestamp + 2000) // resolveBy
            )
        );

        assertEq(betFactory.betCount(), 1);
        assertEq(bet.bet().maker, maker);
    }
}
