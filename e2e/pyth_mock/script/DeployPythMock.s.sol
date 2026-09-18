// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PythMock} from "../src/PythMock.sol";

interface DeployVm {
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployPythMock {
    DeployVm private constant vm = DeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    bytes32 private constant BTC_USD = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 private constant XTZ_USD = 0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03;
    bytes32 private constant USDT_USD = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;

    function run() external returns (PythMock mock) {
        vm.startBroadcast(vm.envUint("MOCK_DEPLOYER_PRIVATE_KEY"));
        mock = new PythMock();
        mock.setPrice(BTC_USD, 6_000_000_000, 1_000_000, -2, block.timestamp - 5);
        mock.setPrice(XTZ_USD, 850_000, 200, -6, block.timestamp - 5);
        mock.setPrice(USDT_USD, 100_010_000, 5_000, -8, block.timestamp - 5);
        vm.stopBroadcast();
    }
}