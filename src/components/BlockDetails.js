import React, { useEffect, useState } from 'react';

const BlockDetails = ({ block }) => {
    const [processedBlock, setProcessedBlock] = useState(null);

    useEffect(() => {
        if (block) {
            // Deep clone the block to avoid direct mutation
            const processedBlock = { ...block };
            // //

            // Ensure critical fields have default values
            processedBlock.proposer = block.proposer;
            processedBlock.question = block.question || "Unknown";
            processedBlock.proposer_ans = block.proposer_ans || "Unknown";
            processedBlock.time = block.time || "N/A";
            processedBlock.supporters = block.supporters || [];
            processedBlock.opposers = block.opposers || [];

            setProcessedBlock(processedBlock);
        }
    }, [block]);

    const formatArray = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) {
            return "[]";
        }
        return `[${arr.join(', ')}]`;
    };
    const formatQuestion = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) {
            return "[]";
        }
        return `${arr.join('+ ')}`;
    };

    if (!processedBlock) {
        return (
            <div className="block-details no-block">
                <p>Select a block to view its details</p>
            </div>
        );
    }

    return (
        <div className="block-details">
            <h3>Block Details</h3>
            <div className="detail-item">
                <strong>Timestamp:</strong> {processedBlock.time}
            </div>
            <div className="detail-item">
                <strong>Proposer:</strong> {processedBlock.proposer}
            </div>
            <div className="detail-item">
                <strong>Question:</strong> {formatQuestion(processedBlock.question)}
            </div>
            <div className="detail-item">
                <strong>Proposer Answer:</strong> {processedBlock.proposer_ans}
            </div>
            <div className="detail-item">
                <strong>Supporters:</strong>{' '}
                <span className="array-display">{formatArray(processedBlock.supporters)}</span>
            </div>
            <div className="detail-item">
                <strong>Opposers:</strong>{' '}
                <span className="array-display">{formatArray(processedBlock.opposers)}</span>
            </div>
        </div>
    );
};

export default BlockDetails;