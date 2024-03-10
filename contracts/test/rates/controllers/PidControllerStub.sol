// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.13;

import "../../accumulators/InputAndErrorAccumulatorStub.sol";
import "../../../rates/controllers/ManagedPidController.sol";

contract PidControllerStub is ManagedPidController, InputAndErrorAccumulatorStub {
    struct Config {
        bool needsUpdateOverridden;
        bool needsUpdate;
    }

    struct OnPauseCall {
        bool paused;
        uint256 callCount;
    }

    Config public config;

    mapping(address => OnPauseCall) public onPauseCalls;

    constructor(
        uint32 period_,
        uint8 initialBufferCardinality_,
        bool updatersMustBeEoa_
    ) ManagedPidController(this, period_, initialBufferCardinality_, updatersMustBeEoa_) {}

    function canUpdate(
        bytes memory data
    ) public view virtual override(ManagedPidController, InputAndErrorAccumulatorStub) returns (bool) {
        return ManagedPidController.canUpdate(data);
    }

    function update(
        bytes memory data
    ) public virtual override(RateController, InputAndErrorAccumulatorStub) returns (bool) {
        return RateController.update(data);
    }

    function lastUpdateTime(
        bytes memory data
    ) public view virtual override(RateController, InputAndErrorAccumulatorStub) returns (uint256) {
        return RateController.lastUpdateTime(data);
    }

    function timeSinceLastUpdate(
        bytes memory data
    ) public view virtual override(RateController, InputAndErrorAccumulatorStub) returns (uint256) {
        return RateController.timeSinceLastUpdate(data);
    }

    function stubPush(address token, uint64 target, uint64 current, uint32 timestamp) public {
        RateLibrary.Rate memory rate;

        rate.target = target;
        rate.current = current;
        rate.timestamp = timestamp;

        push(token, rate);
    }

    function stubInitializeBuffers(address token) public {
        initializeBuffers(token);
    }

    function stubInitialCardinality() public view returns (uint256) {
        return initialBufferCardinality;
    }

    function stubSetITerm(address token, int256 iTerm_) public {
        pidData[token].state.iTerm = iTerm_;
    }

    function overrideNeedsUpdate(bool overridden, bool needsUpdate_) public {
        config.needsUpdateOverridden = overridden;
        config.needsUpdate = needsUpdate_;
    }

    function needsUpdate(
        bytes memory data
    ) public view virtual override(PidController, InputAndErrorAccumulatorStub) returns (bool) {
        if (config.needsUpdateOverridden) return config.needsUpdate;
        else return PidController.needsUpdate(data);
    }

    function onPaused(address token, bool paused) internal virtual override {
        OnPauseCall storage call = onPauseCalls[token];

        call.paused = paused;
        ++call.callCount;
    }
}
