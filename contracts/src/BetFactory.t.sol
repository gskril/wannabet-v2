// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BetFactory} from "./BetFactory.sol";
import {Test} from "forge-std/Test.sol";

contract BetFactoryTest is Test {
    BetFactory betFactory;

    function setUp() public {
        betFactory = new BetFactory("BetFactory");
    }

    function test_Name() public view {
        assertEq(betFactory.name(), "BetFactory");
    }
}
