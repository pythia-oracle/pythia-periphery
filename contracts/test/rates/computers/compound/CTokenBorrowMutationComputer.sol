// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.13;

import "../../../../rates/computers/proto/compound/CTokenBorrowMutationComputer.sol";

contract CTokenBorrowMutationComputerStub is CTokenBorrowMutationComputer {
    constructor(
        uint32 defaultOneXScalar_,
        uint8 defaultDecimals_,
        int8 decimalsOffset_
    ) CTokenBorrowMutationComputer(defaultOneXScalar_, defaultDecimals_, decimalsOffset_) {}

    function stubExtractValueFromToken(address token) public view returns (uint256) {
        return extractValueFromToken(token);
    }

    function stubGetValue(address token) public view returns (uint256) {
        return getValue(token);
    }
}
