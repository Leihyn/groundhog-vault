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

        (bool success,) = address(registry)
            .call(
                abi.encodeCall(
                    registry.recordDecision,
                    (evaluationId, 500, true, bytes32(uint256(1)), bytes32(uint256(2)))
                )
            );
        require(!success, "duplicate accepted");
    }

    function testRejectsAllocationAboveOneHundredPercent() public {
        (bool success,) = address(registry)
            .call(
                abi.encodeCall(
                    registry.recordDecision,
                    (keccak256("evaluation-1"), 10_001, false, bytes32(0), bytes32(0))
                )
            );
        require(!success, "invalid allocation accepted");
    }

    function testRejectsZeroEvaluationId() public {
        (bool success,) = address(registry)
            .call(
                abi.encodeCall(
                    registry.recordDecision, (bytes32(0), 500, false, bytes32(0), bytes32(0))
                )
            );
        require(!success, "zero evaluation id accepted");
    }

    function testAllowsOneHundredPercentBoundary() public {
        bytes32 evaluationId = keccak256("evaluation-100-percent");
        registry.recordDecision(evaluationId, 10_000, false, bytes32(0), bytes32(0));
        (, uint16 allocationBps,,,,) = registry.receipts(evaluationId);
        require(allocationBps == 10_000, "boundary allocation not stored");
    }
}
