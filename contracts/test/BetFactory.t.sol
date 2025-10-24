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
    address judge = makeAddr("judge");
    address owner = makeAddr("owner");
    IERC20 usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IBet bet;

    function setUp() public {
        // Run everything on a fork of Base
        vm.createSelectFork("https://base-rpc.publicnode.com");

        // Mint some USDC to the maker and taker
        vm.startPrank(0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB); // aUSDC token which holds all the underlying USDC
        usdc.transfer(maker, 1000 * 1e6);
        usdc.transfer(taker, 1000 * 1e6);
        vm.stopPrank();

        Bet betImplementation = new Bet();
        betFactory = new BetFactory(owner, address(betImplementation));

        vm.prank(maker);
        bet = IBet(
            betFactory.createBet(
                taker, // taker
                judge, // judge
                address(usdc), // asset
                1000, // makerStake
                1000, // takerStake
                uint40(block.timestamp + 1000), // acceptBy
                uint40(block.timestamp + 2000) // resolveBy
            )
        );
    }

    function test_ForkAndPrank() public view {
        assertEq(block.chainid, 8453);
        assertGt(IERC20(usdc).balanceOf(maker), 1000000000);
    }

    function test_GetDeterministicBetAddress() public view {
        address betAddress = betFactory.predictBetAddress(
            maker,
            taker,
            address(usdc),
            1000,
            1000,
            uint40(block.timestamp + 1000),
            uint40(block.timestamp + 2000)
        );

        assertEq(betAddress, address(bet));
    }

    function test_CreateBetWithNoPool() public {
        assertEq(betFactory.betCount(), 1);
        assertEq(bet.bet().maker, maker);

        // Maker deposits
        vm.startPrank(maker);
        usdc.approve(address(bet), 1000);
        bet.deposit(1000);
        vm.stopPrank();

        // Taker deposits
        vm.startPrank(taker);
        usdc.approve(address(bet), 1000);
        bet.deposit(1000);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(bet)), 2000);
        assertEq(uint(bet.bet().status), uint(IBet.Status.ACTIVE));

        // Judge resolves the bet in favor of thet maker
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.prank(judge);
        bet.resolveBet(maker);
        uint256 makerBalanceAfter = usdc.balanceOf(maker);

        assertEq(makerBalanceAfter - makerBalanceBefore, 2000);
        assertEq(uint(bet.bet().status), uint(IBet.Status.RESOLVED));
    }

    function test_CreateBetWithPool() public {
        // TODO
    }

    function test_BetExpires() public {
        // TODO
    }

    function test_BetCancelled() public {
        // TODO
    }
}
