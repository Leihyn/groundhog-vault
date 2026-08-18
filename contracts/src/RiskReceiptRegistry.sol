// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Public receipts for treasury recommendations produced by Groundhog Vault.
contract RiskReceiptRegistry {
    struct Receipt {
        address recorder;
        uint16 allocationBps;
        bool memoryApplied;
        bytes32 policyIdHash;
        bytes32 incidentIdHash;
        uint64 recordedAt;
    }

    mapping(bytes32 evaluationId => Receipt receipt) public receipts;

    event DecisionRecorded(
        bytes32 indexed evaluationId,
        address indexed recorder,
        uint16 allocationBps,
        bool memoryApplied,
        bytes32 policyIdHash,
        bytes32 incidentIdHash
    );

    error InvalidEvaluationId();
    error InvalidAllocation();
    error ReceiptAlreadyExists();

    function recordDecision(
        bytes32 evaluationId,
        uint16 allocationBps,
        bool memoryApplied,
        bytes32 policyIdHash,
        bytes32 incidentIdHash
    ) external {
        if (evaluationId == bytes32(0)) revert InvalidEvaluationId();
        if (allocationBps > 10_000) revert InvalidAllocation();
        if (receipts[evaluationId].recorder != address(0)) revert ReceiptAlreadyExists();

        receipts[evaluationId] = Receipt({
            recorder: msg.sender,
            allocationBps: allocationBps,
            memoryApplied: memoryApplied,
            policyIdHash: policyIdHash,
            incidentIdHash: incidentIdHash,
            recordedAt: uint64(block.timestamp)
        });

        emit DecisionRecorded(
            evaluationId, msg.sender, allocationBps, memoryApplied, policyIdHash, incidentIdHash
        );
    }
}
