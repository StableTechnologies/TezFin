// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PythMock} from "../src/PythMock.sol";

interface TestVm {
    function expectRevert() external;
    function warp(uint256 timestamp) external;
}

contract PythMockTest {
    TestVm private constant vm = TestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32 private constant BTC = keccak256("BTC/USD");
    uint256 private constant NOW = 1_700_000_000;

    PythMock private mock;

    function setUp() public {
        vm.warp(NOW);
        mock = new PythMock();
        mock.setPrice(BTC, 6_000_000_000, 1_000_000, -2, NOW - 5);
    }

    function testValidPriceAndAbiResponse() public {
        PythMock.Price memory result = mock.getPriceNoOlderThan(BTC, 60);
        require(result.price == 6_000_000_000, "price");
        require(result.conf == 1_000_000, "confidence");
        require(result.expo == -2, "exponent");
        require(result.publishTime == NOW - 5, "publish time");
    }

    function testAbiResponseIsFourStaticWords() public {
        (bool success, bytes memory response) = address(mock).staticcall(
            abi.encodeWithSelector(mock.getPriceNoOlderThan.selector, BTC, uint256(60))
        );
        require(success, "staticcall failed");
        require(response.length == 128, "ABI response length");
        (int64 price, uint64 conf, int32 expo, uint256 publishTime) = abi.decode(
            response, (int64, uint64, int32, uint256)
        );
        require(price == 6_000_000_000, "ABI price");
        require(conf == 1_000_000, "ABI confidence");
        require(expo == -2, "ABI exponent");
        require(publishTime == NOW - 5, "ABI publish time");
    }

    function testStalePriceReverts() public {
        mock.setPrice(BTC, 1, 0, -6, NOW - 61);
        vm.expectRevert();
        mock.getPriceNoOlderThan(BTC, 60);
    }

    function testFutureTimestampIsReturnedOnlyWithAgeCheckDisabled() public {
        mock.setPrice(BTC, 1, 0, -6, NOW + 1);
        vm.expectRevert();
        mock.getPriceNoOlderThan(BTC, 60);
        mock.setIgnoreAgeCheck(true);
        require(mock.getPriceNoOlderThan(BTC, 60).publishTime == NOW + 1, "future timestamp");
    }

    function testTimestampRollbackSequenceIsRepresentable() public {
        mock.setPrice(BTC, 2, 0, -6, NOW - 2);
        require(mock.getPriceNoOlderThan(BTC, 60).publishTime == NOW - 2, "new timestamp");
        mock.setPrice(BTC, 1, 0, -6, NOW - 3);
        require(mock.getPriceNoOlderThan(BTC, 60).publishTime == NOW - 3, "rollback timestamp");
    }

    function testValidToInvalidSequence() public {
        require(mock.getPriceNoOlderThan(BTC, 60).price > 0, "valid value");
        mock.setPrice(BTC, 0, 0, -2, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).price == 0, "invalid value");
    }

    function testInvalidToValidSequence() public {
        mock.setPrice(BTC, 0, 0, -2, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).price == 0, "invalid value");
        mock.setPrice(BTC, 42, 1, -6, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).price == 42, "valid value");
    }

    function testZeroPrice() public {
        mock.setPrice(BTC, 0, 0, -6, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).price == 0, "zero price");
    }

    function testNegativePrice() public {
        mock.setPrice(BTC, -42, 1, -2, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).price == -42, "negative price");
    }

    function testInvalidExponent() public {
        mock.setPrice(BTC, 42, 1, 1, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).expo == 1, "exponent");
    }

    function testExcessiveConfidence() public {
        mock.setPrice(BTC, 100_000, 30_000, -6, NOW - 1);
        require(mock.getPriceNoOlderThan(BTC, 60).conf == 30_000, "confidence");
    }

    function testSimulatedRevert() public {
        mock.setRevert(true);
        vm.expectRevert();
        mock.getPriceNoOlderThan(BTC, 60);
    }

    function testUnknownFeed() public {
        vm.expectRevert();
        mock.getPriceNoOlderThan(keccak256("UNKNOWN/USD"), 60);
    }
}