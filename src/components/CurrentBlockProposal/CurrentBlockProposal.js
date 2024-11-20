import React, { useState, useEffect } from 'react';

const CurrentBlockProposal = ({ socket, userId, currentPhase }) => {
    const [proposalDetails, setProposalDetails] = useState({
        answer: null,
        proposer: userId,
        timestamp: '',
    });
    const [proposalSubmitted, setProposalSubmitted] = useState(false);
    const [proposedNumber, setProposedNumber] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetProposalState = () => {
        setProposalDetails({
            answer: null,
            proposer: userId,
            timestamp: '',
        });
        setProposalSubmitted(false);
        setProposedNumber('');
        setError(null);
        setIsLoading(false);
        // //
    };

    useEffect(() => {
        if (!socket) return;

        const handleProposalResponse = (response) => {
            // // Debug log
            setIsLoading(false);

            switch (response.code) {
                case 8:
                    // Successful proposal
                    const timestamp = new Date().toISOString();
                    setProposalDetails({
                        answer: response.proposal,
                        proposer: userId,
                        timestamp,
                    });
                    setProposalSubmitted(true);
                    setError(null);
                    break;

                case 7:
                    setError("A block proposal has already been submitted");
                    break;

                case 6:
                    setError("System is not currently in block proposal mode");
                    break;

                case 5:
                    setError("You are not authorized to submit a proposal at this time");
                    break;

                case 4:
                    setError("Invalid proposal format - must be a number");
                    break;

                default:
                    setError("An unexpected error occurred");
            }
        };

        // Handle new round or phase changes
        const handlePhaseChange = (phaseData) => {
            // // Debug log
            resetProposalState();
        };

        const handleNewRound = (roundData) => {
            // // Debug log
            resetProposalState();
        };

        const handleMode = () => {
            setProposalSubmitted(false);
        }

        socket.on('propose-res', handleProposalResponse);
        // socket.on('mode', handleMode);

        return () => {
            socket.off('propose-res', handleProposalResponse);
            // socket.off('mode', handleMode);
        };
    }, [socket, userId]);

    const handleNumberChange = (e) => {
        // Only allow integer inputs
        const value = e.target.value.replace(/\D/g, '');
        setProposedNumber(value);
    };

    const submitProposal = () => {
        if (!socket) {
            setError("No connection to server");
            return;
        }

        if (proposalSubmitted) {
            setError("Block proposal already submitted!");
            return;
        }

        // Convert to integer and validate
        const numberValue = Number(proposedNumber);

        // Validate that it's a valid integer
        if (!Number.isInteger(numberValue)) {
            setError("Please enter a valid integer");
            return;
        }

        // // Debug log

        setIsLoading(true);
        setError(null);

        // Emit the pure integer
        socket.emit('propose', numberValue);
    };

    useEffect(() => {
        if (proposalSubmitted == true && currentPhase != "a") {

            setProposedNumber('');
            setProposalSubmitted(false);
        }
    })

    return (
        <div className="proposal-container">
            <div className="proposal-card">
                <h2 className="proposal-title">Block Proposal</h2>

                <div className="proposal-content">
                    <p className="proposer-id">
                        <strong>Proposer ID:</strong> {userId}
                    </p>

                    {(currentPhase === "a") ?
                        ((!proposalSubmitted) ? (
                            <div className="proposal-input-section">
                                <div className="w-full">
                                    <input
                                        type="number"
                                        value={proposedNumber}
                                        onChange={handleNumberChange}
                                        onKeyPress={(e) => {
                                            // Prevent decimal point and negative numbers
                                            if (e.key === '.' || e.key === '-' || e.key === 'e') {
                                                e.preventDefault();
                                            }
                                        }}
                                        placeholder="Enter a number"
                                        className="number-input"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                                <div className="w-full">
                                    <button
                                        onClick={submitProposal}
                                        disabled={isLoading || !socket || !proposedNumber}
                                        className="submit-button"
                                    >
                                        {isLoading ? "Submitting..." : "Submit"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="proposal-success">
                                <div className="success-message">
                                    <h3>Proposal Submitted Successfully</h3>
                                    <p><strong>Proposed Answer :</strong> {proposalDetails.answer}</p>
                                </div>
                            </div>)
                        ) : (
                            <div>Block proposal phase has ended.</div>)
                    }

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .proposal-container {
                    width: 100%;
                    padding: 16px;
                }

                .proposal-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .proposal-title {
                    font-size: 20px;
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .proposal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .proposer-id {
                    margin: 0;
                    color: #555;
                    font-size: 14px;
                }

                .proposal-input-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .number-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .number-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    ring: 2px;
                    ring-color: #93c5fd;
                }

                .submit-button {
                    width: 100%;
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                    justify-content: center;
                }

                .submit-button:hover:not(:disabled) {
                    background: #1d4ed8;
                }

                .submit-button:disabled {
                    background: #93c5fd;
                    cursor: not-allowed;
                }

                .proposal-success {
                    background: #ecfdf5;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #6ee7b7;
                    font-size: 14px;
                }

                .success-message h3 {
                    color: #065f46;
                    margin: 0 0 8px 0;
                    font-size: 16px;
                }

                .success-message p {
                    margin: 6px 0;
                    color: #047857;
                }

                .error-message {
                    background: #fef2f2;
                    color: #991b1b;
                    padding: 10px 12px;
                    border-radius: 6px;
                    border: 1px solid #fecaca;
                    font-size: 14px;
                }

                .error-message p {
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default CurrentBlockProposal;