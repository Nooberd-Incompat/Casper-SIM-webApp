import React, { useState, useEffect } from 'react';
import './VotingMechanism.css';

const VotingMechanism = ({ socket, proposerID, validators, currentMode, currentValidatorId }) => {
    const [vote, setVote] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [roundComplete, setRoundComplete] = useState(false);
    const [isValidator, setIsValidator] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleServerMessage = (response) => {
            //
            setIsValidator(validators?.includes(currentValidatorId));
            setIsLoading(false);

            // Update error based on response codes
            switch (response.code) {
                case "9":
                    setError("You are not authorized as a validator");
                    break;
                case "10":
                    setError("System is not in validation mode");
                    break;
                case "11":
                    setError("You are not registered as a stakeholder");
                    break;
                default:
                    setError(null);
            }
        };

        const handleRoundComplete = () => {
            // Allow voting in the next round
            setRoundComplete(true);
            // Reset vote for the next round
            setVote(null);
        };

        socket.on('server_msg', handleServerMessage);
        socket.on('round_complete', handleRoundComplete);

        // Reset states when mode changes
        if (currentMode !== 'b') {
            resetStates();
        }

        return () => {
            socket.off('server_msg', handleServerMessage);
            socket.off('round_complete', handleRoundComplete);
        };
    }, [socket, currentMode, currentValidatorId, validators]);

    const resetStates = () => {
        setVote(null); // Reset vote for new rounds
        setError(null);
        setRoundComplete(false);
    };

    const handleVote = (choice) => {
        if (!socket) {
            setError("No connection to server");
            return;
        }
        if (!isValidator) {
            setError("You are not authorized to vote in this round");
            return;
        }
        if (vote !== null) {
            setError("You have already voted!"); // Keep this line if you want to restrict changing votes
            return;
        }

        setIsLoading(true);
        setError(null); // Clear previous errors
        if (choice === 'approve') {
            socket.emit('validate');
        } // Send the vote choice to the backend
        setVote(choice);
    };

    return (
        <div className="voting-container">
            <div className="voting-card">
                <h3 className="voting-title">Block Validation</h3>
                {currentMode === 'b' ? (
                    <div className="voting-content">
                        <p className="voting-prompt">Vote on the proposed block by proposer ID : {proposerID}</p>
                        {isValidator ? (
                            <>
                                <div className="voting-buttons">
                                    {/* Render buttons only if a vote hasn't been cast */}
                                    {vote === null && !roundComplete && (
                                        <>
                                            <button
                                                onClick={() => handleVote('approve')}
                                                disabled={isLoading || roundComplete}
                                                className="vote-button approve"
                                            >
                                                {isLoading ? "Submitting..." : "Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleVote('reject')}
                                                disabled={isLoading || roundComplete}
                                                className="vote-button reject"
                                            >
                                                {isLoading ? "Submitting..." : "Reject"}
                                            </button>
                                        </>
                                    )}
                                    {/* Show the user's vote status */}
                                    {vote && !roundComplete && (
                                        <div className="vote-status">
                                            <p>Your vote: <strong>{vote}</strong></p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="info-message">
                                <p>You are not authorized to vote in this round</p>
                            </div>
                        )}
                        {error && (
                            <div className="error-message">
                                <p>{error}</p>
                            </div>
                        )}
                        {roundComplete && (
                            <div className="info-message">
                                <p>Voting round complete</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="waiting-message">Waiting for validation phase to begin...</p>
                )}
            </div>

            {/* Styles can be moved to a separate CSS file for better organization */}
            <style jsx>{`
                .voting-container {
                    padding: 20px;
                    border: 1px solid #a6dff3;
                    margin: 10px;
                    background-color: #58DBEE;
                    border-radius: 5px;
                    color: black;
                }
                .voting-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .voting-title {
                    font-size: 20px;
                    margin: 0 0 16px 0;
                    color: #333;
                }
                .voting-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .voting-prompt {
                    margin: 0;
                    color: #555;
                    font-size: 14px;
                }
                .voting-buttons {
                    display: flex;
                    gap: 12px;
                }
                .vote-button {
                    flex: 1;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .vote-button:disabled {
                    opacity: 0.5; 
                    cursor: not-allowed; 
                }
                .approve { background: #10b981; color: white; }
                .approve:hover:not(:disabled) { background: #059669; }
                .reject { background: #ef4444; color: white; }
                .reject:hover:not(:disabled) { background: #dc2626; }
                .vote-status { background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 14px; }
                .error-message { background: #fef2f2; color: #991b1b; padding: 10px 12px; border-radius: 6px; border: 1px solid #fecaca; font-size: 14px; }
                .info-message { background: #f0f9ff; color: #075985; padding: 10px 12px; border-radius: 6px; border: 1px solid #bae6fd; font-size: 14px; }
                .waiting-message { color: #6b7280; font-style: italic; margin-top: -10px; font-size: 14px; }
            `}</style>
        </div>
    );
};

export default VotingMechanism;

