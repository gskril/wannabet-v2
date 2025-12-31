// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IPool} from "@aave/v3/interfaces/IPool.sol";

import {Bet} from "../src/Bet.sol";
import {BetFactory} from "../src/BetFactory.sol";
import {IBet} from "../src/interfaces/IBet.sol";

// Note: Tests that involve Aave pools have some margin for error due to their tiny rounding cases
contract BetFactoryTest is Test {
    BetFactory betFactory;
    // address maker = makeAddr("maker");
    address maker = 0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF; // slobo
    address taker = makeAddr("taker");
    address judge = makeAddr("judge");
    address owner = makeAddr("owner");
    IERC20 usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 aUSDC = IERC20(0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB); // holds all the underlying USDC in Aave
    address aaveUsdcPool = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    IBet betNoPool;
    IBet betWithPool;

    function setUp() public {
        // Run everything on a fork of Base
        vm.createSelectFork("https://base-rpc.publicnode.com");

        // Mint some USDC to the maker and taker
        vm.startPrank(address(aUSDC));
        usdc.transfer(maker, 1000 * 1e6);
        usdc.transfer(taker, 1000 * 1e6);
        vm.stopPrank();

        Bet betImplementation = new Bet();
        betFactory = new BetFactory(owner, address(betImplementation));

        // Predict the first bet address
        address betNoPoolAddress = betFactory.predictBetAddress(
            maker,
            taker,
            uint40(block.timestamp + 1000), // acceptBy
            uint40(block.timestamp + 2000) // endsBy
        );

        vm.startPrank(maker);
        usdc.approve(address(betNoPoolAddress), 1000);
        betNoPool = IBet(
            betFactory.createBet(
                taker,
                judge,
                address(usdc),
                1000,
                1000,
                uint40(block.timestamp + 1000), // acceptBy
                uint40(block.timestamp + 2000), // endsBy
                "Test bet"
            )
        );
        vm.stopPrank();

        // Configure the Aave pool for USDC
        vm.warp(block.timestamp + 1); // Avoid create2 conflicts with the original bet

        vm.prank(owner);
        vm.expectEmit();
        emit BetFactory.PoolConfigured(address(usdc), aaveUsdcPool);
        betFactory.setPool(address(usdc), aaveUsdcPool);

        address betWithPoolAddress = betFactory.predictBetAddress(
            maker,
            taker,
            uint40(block.timestamp + 1000), // acceptBy
            uint40(block.timestamp + 2000) // endsBy
        );

        vm.startPrank(maker);
        usdc.approve(address(betWithPoolAddress), 1000);

        // The balance of aUSDC in the new bet should be 0 before its created
        assertEq(aUSDC.balanceOf(betWithPoolAddress), 0);

        // Create the bet
        betWithPool = IBet(
            betFactory.createBet(
                taker,
                judge,
                address(usdc),
                1000,
                1000,
                uint40(block.timestamp + 1000), // acceptBy
                uint40(block.timestamp + 2000), // endsBy
                "Test bet"
            )
        );
        vm.stopPrank();
    }

    function test_ForkAndPrankAndBasics() public view {
        assertEq(block.chainid, 8453);
        assertGt(IERC20(usdc).balanceOf(maker), 1000000000);
        assertEq(betFactory.betCount(), 2);
        assertEq(betNoPool.bet().maker, maker);
    }

    function test_GetDeterministicBetAddress() public view {
        address betWithPoolAddress = betFactory.predictBetAddress(
            maker,
            taker,
            uint40(block.timestamp + 1000), // acceptBy
            uint40(block.timestamp + 2000) // endsBy
        );

        assertEq(betWithPoolAddress, address(betWithPool));
    }

    function test_CreateBetWithNoPool() public {
        // Taker deposits
        vm.startPrank(taker);
        usdc.approve(address(betNoPool), 1000);
        vm.expectEmit();
        emit IBet.BetAccepted();
        betNoPool.accept();
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(betNoPool)), 2000);
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.ACTIVE));

        // Judge resolves the bet in favor of thet maker
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.prank(judge);
        betNoPool.resolve(maker);
        uint256 makerBalanceAfter = usdc.balanceOf(maker);

        assertEq(makerBalanceAfter - makerBalanceBefore, 2000);
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.RESOLVED));
    }

    function test_CreateBetWithPool() public {
        address betWithPoolAddress = address(betWithPool);

        // There should be aUSDC in the bet contract, but no USDC
        assertGt(aUSDC.balanceOf(betWithPoolAddress), 0);
        assertEq(usdc.balanceOf(betWithPoolAddress), 0);

        // Have the taker accept the bet and verify their deposit is also sent to Aave
        vm.startPrank(taker);
        usdc.approve(address(betWithPoolAddress), 1000);
        betWithPool.accept();
        vm.stopPrank();

        assertGt(aUSDC.balanceOf(betWithPoolAddress), 1000);
        assertEq(usdc.balanceOf(betWithPoolAddress), 0);

        // Skip ahead, resolve the bet in favor of the maker which should withdraw the funds from Aave
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.warp(block.timestamp + 1000);
        vm.prank(judge);
        betWithPool.resolve(maker);

        uint256 makerBalanceAfter = usdc.balanceOf(maker);
        assertGt(makerBalanceAfter - makerBalanceBefore, 0);
        assertEq(aUSDC.balanceOf(betWithPoolAddress), 0);
        assertEq(usdc.balanceOf(betWithPoolAddress), 0);
    }

    // Maker or taker doesn't deposit in time
    function test_BetNoPoolExpiresBeforeStarting() public {
        vm.warp(block.timestamp + 1001);

        // At this point, the bet should be expired
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.EXPIRED));

        // Can't deposit to a bet after `acceptBy` has passed
        vm.startPrank(taker);
        usdc.approve(address(betNoPool), 1000);
        vm.expectRevert(IBet.InvalidStatus.selector);
        betNoPool.accept();
        vm.stopPrank();

        // Anybody can refund/cancel an expired bet, which sends funds back to each party
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        betNoPool.cancel();
        assertEq(usdc.balanceOf(maker) - makerBalanceBefore, 1000);
    }

    // Check Aave logic in the `cancel` function
    function test_BetWithPoolExpiresBeforeStarting() public {
        vm.warp(block.timestamp + 1001);

        // At this point, the bet should be expired because it wasn't accepted by `acceptBy`
        assertEq(uint(betWithPool.bet().status), uint(IBet.Status.EXPIRED));

        // Anybody can refund/cancel an expired bet, which sends funds back to each party (just maker in this case)
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        betWithPool.cancel();
        assertGt(usdc.balanceOf(maker), makerBalanceBefore);
    }

    // Judge doesn't resolve the bet in time (within the 30-day judging window)
    function test_BetWithPoolExpiresAfterNoResolution() public {
        vm.startPrank(taker);
        usdc.approve(address(betWithPool), 1000);
        betWithPool.accept();
        vm.stopPrank();

        // Warp past endsBy + JUDGING_WINDOW (30 days)
        vm.warp(block.timestamp + 2001 + 30 days);

        // At this point, the bet should be expired (passed `endsBy + JUDGING_WINDOW`)
        assertEq(uint(betWithPool.bet().status), uint(IBet.Status.EXPIRED));

        // Anybody can refund/cancel an expired bet, which sends funds back to each party
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        uint256 takerBalanceBefore = usdc.balanceOf(taker);
        betWithPool.cancel();
        assertGt(usdc.balanceOf(maker) - makerBalanceBefore, 0);

        // The taker should have their funds refunded too
        assertGt(usdc.balanceOf(taker) - takerBalanceBefore, 0);
    }

    function test_BetNoPoolCancelledByMaker() public {
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.prank(maker);
        betNoPool.cancel();
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.CANCELLED));

        // The maker should have their funds refunded
        assertEq(usdc.balanceOf(maker) - makerBalanceBefore, 1000);
    }

    function test_BetWithPoolCancelledByMaker() public {
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.prank(maker);
        betWithPool.cancel();
        assertEq(uint(betWithPool.bet().status), uint(IBet.Status.CANCELLED));

        // The maker should have their funds refunded
        assertGt(usdc.balanceOf(maker) - makerBalanceBefore, 0);
    }

    // Judge can still resolve the bet during the 30-day judging window after endsBy
    function test_JudgeCanResolveWithinJudgingWindow() public {
        vm.startPrank(taker);
        usdc.approve(address(betWithPool), 1000);
        betWithPool.accept();
        vm.stopPrank();

        // Warp to a time past endsBy but within the 30-day judging window
        vm.warp(block.timestamp + 2001 + 15 days);

        // The bet should be in JUDGING status (past endsBy but before deadline)
        assertEq(uint(betWithPool.bet().status), uint(IBet.Status.JUDGING));

        // Judge can still resolve the bet within the judging window
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        vm.prank(judge);
        betWithPool.resolve(maker);

        // The bet should now be resolved
        assertEq(uint(betWithPool.bet().status), uint(IBet.Status.RESOLVED));
        assertGt(usdc.balanceOf(maker) - makerBalanceBefore, 0);
    }

    // Only judge can cancel an ACTIVE or JUDGING bet
    function test_ActiveBetCanOnlyBeCancelledByJudge() public {
        // 1. Have the taker accept the bet so it becomes ACTIVE
        vm.startPrank(taker);
        usdc.approve(address(betNoPool), 1000);
        betNoPool.accept();
        vm.stopPrank();

        // Sanity check: bet is ACTIVE
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.ACTIVE));

        // 2. Warp to a time before endsBy so the bet is still ACTIVE
        IBet.Bet memory state = betNoPool.bet();
        vm.warp(uint256(state.endsBy) - 1);
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.ACTIVE));
        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        uint256 takerBalanceBefore = usdc.balanceOf(taker);

        // 3. Taker attempts to cancel the bet, reverts
        vm.prank(taker);
        vm.expectRevert(IBet.Unauthorized.selector);
        betNoPool.cancel();

        // 4. Judge cancels the bet, the bet is marked CANCELLED and funds are refunded
        vm.prank(judge);
        vm.expectEmit();
        emit IBet.BetCancelled();
        betNoPool.cancel();
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.CANCELLED));
        assertGt(usdc.balanceOf(maker), makerBalanceBefore);
        assertGt(usdc.balanceOf(taker), takerBalanceBefore);
    }

    // Test judge can cancel during JUDGING period
    function test_JudgingBetCanBeCancelledByJudge() public {
        // 1. Have the taker accept the bet so it becomes ACTIVE
        vm.startPrank(taker);
        usdc.approve(address(betNoPool), 1000);
        betNoPool.accept();
        vm.stopPrank();

        // 2. Warp past endsBy to enter JUDGING period
        IBet.Bet memory state = betNoPool.bet();
        vm.warp(uint256(state.endsBy) + 1);
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.JUDGING));

        uint256 makerBalanceBefore = usdc.balanceOf(maker);
        uint256 takerBalanceBefore = usdc.balanceOf(taker);

        // 3. Taker attempts to cancel the bet during JUDGING, reverts
        vm.prank(taker);
        vm.expectRevert(IBet.Unauthorized.selector);
        betNoPool.cancel();

        // 4. Judge cancels the bet during JUDGING period
        vm.prank(judge);
        betNoPool.cancel();
        assertEq(uint(betNoPool.bet().status), uint(IBet.Status.CANCELLED));
        assertGt(usdc.balanceOf(maker), makerBalanceBefore);
        assertGt(usdc.balanceOf(taker), takerBalanceBefore);
    }
}
