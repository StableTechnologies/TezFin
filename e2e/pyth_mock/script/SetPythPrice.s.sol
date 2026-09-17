// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PythMock} from "../src/PythMock.sol";

interface SetPriceVm {
    function envAddress(string calldata name) external returns (address);
    function envBytes32(string calldata name) external returns (bytes32);
    function envInt(string calldata name) external returns (int256);
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract SetPythPrice {
    SetPriceVm private constant vm = SetPriceVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external {
        vm.startBroadcast(vm.envUint("MOCK_DEPLOYER_PRIVATE_KEY"));
        PythMock(vm.envAddress("PYTH_MOCK_ADDRESS")).setPrice(
            vm.envBytes32("PYTH_PRICE_ID"),
            int64(vm.envInt("PYTH_PRICE")),
            uint64(vm.envUint("PYTH_CONF")),
            int32(vm.envInt("PYTH_EXPO")),
            vm.envUint("PYTH_PUBLISH_TIME")
        );
        vm.stopBroadcast();
    }
}