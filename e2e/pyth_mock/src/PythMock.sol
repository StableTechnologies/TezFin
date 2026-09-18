// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only read oracle with the ABI consumed by TezFinOracle.
/// @dev This intentionally does not implement any Pyth update or verification logic.
contract PythMock {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    mapping(bytes32 => Price) private prices;
    mapping(bytes32 => bool) private configured;

    address public immutable admin;
    bool public revertEnabled;
    bool public ignoreAgeCheck;

    error NotAdmin();
    error PriceNotConfigured();
    error PriceIsStale();
    error ForcedRevert();

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function setPrice(
        bytes32 priceId,
        int64 price,
        uint64 conf,
        int32 expo,
        uint256 publishTime
    ) external onlyAdmin {
        prices[priceId] = Price(price, conf, expo, publishTime);
        configured[priceId] = true;
    }

    function setRevert(bool enabled) external onlyAdmin {
        revertEnabled = enabled;
    }

    function setIgnoreAgeCheck(bool enabled) external onlyAdmin {
        ignoreAgeCheck = enabled;
    }

    function getPriceNoOlderThan(bytes32 priceId, uint256 age)
        external
        view
        returns (Price memory)
    {
        if (revertEnabled) revert ForcedRevert();
        if (!configured[priceId]) revert PriceNotConfigured();

        Price memory result = prices[priceId];
        if (!ignoreAgeCheck) {
            if (result.publishTime > block.timestamp || block.timestamp - result.publishTime > age) {
                revert PriceIsStale();
            }
        }
        return result;
    }
}