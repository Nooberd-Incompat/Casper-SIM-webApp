import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../App';
import './StakeStatus.css';

const StakeStatus = ({ botId }) => {
    const socket = useContext(SocketContext);
    const [validatorStatus, setValidatorStatus] = useState({
        currentStake: 0,
        previousStake: 0,
        isActive: false,
        isProposer: false,
        isValidator: false,
        lastUpdate: null,
    });

    // Function to fetch current stake
    const fetchStake = async () => {
        try {
            const response = await fetch(`http://localhost:5000/get-stake/${botId}`);
            const data = await response.json();

            if (data.stake !== undefined) {
                setValidatorStatus(prev => ({
                    ...prev,
                    previousStake: prev.currentStake, // Store previous stake before updating
                    currentStake: data.stake
                }));
            }
        } catch (error) {
            console.error('Error fetching stake:', error);
        }
    };

    useEffect(() => {
        if (!socket) return;

        // Initial fetch
        fetchStake();

        // Listen for mode changes
        socket.on('mode', (data) => {
            if (data.msg === 'publish_results') {
                // Refresh stake after results are published
                fetchStake();
                setValidatorStatus(prev => ({
                    ...prev,
                    lastUpdate: new Date().toLocaleTimeString()
                }));
            }
        });

        // Listen for server messages
        socket.on('server_msg', (message) => {
            // Update proposer status
            if (message.proposer !== undefined) {
                setValidatorStatus(prev => ({
                    ...prev,
                    isProposer: message.proposer === parseInt(botId)
                }));
            }

            // Update validator status
            if (message.validators) {
                setValidatorStatus(prev => ({
                    ...prev,
                    isValidator: message.validators.includes(parseInt(botId))
                }));
            }
        });

        // Cleanup listeners
        return () => {
            socket.off('mode');
            socket.off('server_msg');
        };
    }, [socket, botId]);

    // Determine the status class based on stake change
    const getStakeChangeClass = () => {
        if (validatorStatus.currentStake > validatorStatus.previousStake) {
            return 'stake-increase'; // Green for increase
        } else if (validatorStatus.currentStake < validatorStatus.previousStake) {
            return 'stake-decrease'; // Red for decrease
        }
        return ''; // No change
    };

    return (
        <div className="stake-status">
            <h3>Stake Status</h3>
            <div className={`status-info ${getStakeChangeClass()}`}>
                <p>
                    <strong>Current Stake:</strong> {validatorStatus.currentStake} tokens
                </p>
                <p>
                    <strong>Current Role:</strong>{' '}
                    {validatorStatus.isProposer
                        ? 'Proposer'
                        : validatorStatus.isValidator
                            ? 'Validator'
                            : 'Observer'}
                </p>
                {validatorStatus.lastUpdate && (
                    <p>
                        <strong>Last Update:</strong> {validatorStatus.lastUpdate}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StakeStatus;
