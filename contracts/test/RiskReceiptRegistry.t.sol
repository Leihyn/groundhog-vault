// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RiskReceiptRegistry} from "../src/RiskReceiptRegistry.sol";

contract RiskReceiptRegistryTest {
    RiskReceiptRegistry private registry;

    function setUp() public {
        registry = new RiskReceiptRegistry();
    }

    function testRecordsMemoryBackedDecision() public {
        bytes32 evaluationId = keccak256("evaluation-1");
        bytes32 policyIdHash = keccak256("policy-1");
        bytes32 incidentIdHash = keccak256("incident-1");

        registry.recordDecision(evaluationId, 500, true, policyIdHash, incidentIdHash);

        (
            address recorder,
            uint16 allocationBps,
            bool memoryApplied,
            bytes32 storedPolicyHash,
            bytes32 storedIncidentHash,
            uint64 recordedAt
        ) = registry.receipts(evaluationId);

        require(recorder == address(this), "wrong recorder");
        require(allocationBps == 500, "wrong allocation");
        require(memoryApplied, "memory flag missing");
        require(storedPolicyHash == policyIdHash, "wrong policy hash");
        require(storedIncidentHash == incidentIdHash, "wrong incident hash");
        require(recordedAt > 0, "timestamp missing");
    }

    function testRejectsDuplicateEvaluation() public {
        bytes32 evaluationId = keccak256("evaluation-1");
        registry.recordDecision(evaluationId, 500, true, bytes32(uint256(1)), bytes32(uint256(2)));

        try registry.recordDecision(
            evaluationId, 500, true, bytes32(uint256(1)), bytes32(uint256(2))
        ) {
            revert("duplicate accepted");
        } catch {}
    }

    function testRejectsAllocationAboveOneHundredPercent() public {
        try registry.recordDecision(
            keccak256("evaluation-1"), 10_001, false, bytes32(0), bytes32(0)
        ) {
            revert("invalid allocation accepted");
        } catch {}
    }
}
