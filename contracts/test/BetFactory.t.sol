// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Bet} from "../src/Bet.sol";
import {BetFactory} from "../src/BetFactory.sol";
import {Test} from "forge-std/Test.sol";

contract BetFactoryTest is Test {
    BetFactory betFactory;

    address owner = makeAddr("owner");

    function setUp() public {
        Bet betImplementation = new Bet();
        betFactory = new BetFactory(owner, address(betImplementation));
    }

    function test_Name() public view {
        assertEq(betFactory.name(), "BetFactory");
    }
}
