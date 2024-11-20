import React, { useState, useEffect, useContext } from 'react';
import './CurrentBlock.css'
import { SocketContext } from '../App';


const CurrentBlock = ({ question, proposedAnswer: newProposedAnswer, proposer,
    currentPhase,
    startTime,
    currMode
}) => {
    const socket = useContext(SocketContext);
    const [proposedAnswer, setProposedAnswer] = useState(undefined);
    const [timeLeft, setTimeLeft] = useState(null);
    const [config, setConfig] = useState({
        requested: "",
        proposer_time: 30,     // Default values
        validator_time: 20,
        publish_results_time: 10
    });
    const [isLoading, setIsLoading] = useState(true);
    const [rTimeStamp, setTimeStamp] = useState("");
    const [rquestion, setQuestion] = useState([]);
    const [rproposer, setProposer] = useState("");
    const [rproposerAns, setProposerAns] = useState("");
    const [supporters, setSupporters] = useState([]);
    const [opposers, setOpposers] = useState([]);
    const [noBlockProposed, setNoBlockProposed] = useState(false);


    const fetchConfig = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-configs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setConfig(data);
            // console.log(config);
        } catch (error) {
            console.error('Error fetching config:', error);
            // Keep using default values if fetch fails
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (config.requested !== undefined) {
            fetchConfig();
        };

    }, []);

    useEffect(() => {
        console.log("Updated config:", config);
    }, [config]);

    useEffect(() => {
        const handleServerMessage = (msgData) => {
            if (msgData.code === "10" && msgData.msg === "Block not proposed") {
                setNoBlockProposed(true);
            }
            else {
                setNoBlockProposed(false);
            }
        };

        socket.on('server_msg', handleServerMessage);
        return () => {
            socket.off('server_msg', handleServerMessage);
        };
    }, [socket]);


    // Now PHASE_DURATIONS will always have valid values
    const PHASE_DURATIONS = {
        'a': config.proposer_time,
        'b': config.validator_time,
        'c': config.publish_results_time,
        'mode': config.cur_mode
    };

    useEffect(() => {
        if (newProposedAnswer !== undefined) {
            setProposedAnswer(newProposedAnswer);
        }
    }, [newProposedAnswer]);

    useEffect(() => {
        if (!currentPhase || !startTime || isLoading) return;

        const calculateTimeLeft = () => {
            const now = Date.now();
            const phaseStartTime = typeof startTime === 'string'
                ? new Date(startTime).getTime()
                : startTime;
            const phaseDuration = PHASE_DURATIONS[currentPhase] * 1000;
            const endTime = phaseStartTime + phaseDuration;
            const remaining = Math.max(0, endTime - now);

            return Math.ceil(remaining / 1000);
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [currentPhase, startTime, isLoading, config]); // Added config as dependency

    useEffect(() => {
        const handleResults = (results) => {
            console.log("THERE YOY ARE", results);
            setProposer(results.proposer || "");
            setProposerAns(results.proposer_ans || "");
            setTimeStamp(results.time_stamp || "");
            setQuestion(results.question || [-1, -1]);
            setSupporters(results.supporters || []);
            setOpposers(results.opposers || []);
        };


        socket.on('results', handleResults);
        return () => {
            socket.off('results', handleResults);
        }
    })


    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getPhaseDisplayName = (phase) => {
        switch (phase) {
            case 'a':
                return 'Block Proposal ';
            case 'b':
                return 'Validation ';
            case 'c':
                return 'Results ';
            default:
                return phase;
        }
    };

    if (isLoading) {
        return <div>Loading configuration...</div>;
    }

    return (
        <div className="current-block">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{getPhaseDisplayName(currentPhase)}</h2>
                {currentPhase && (
                    <div className="flex items-center space-x-2">
                        <br />
                        {config.cur_mode === 1 && (<span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            {formatTime(timeLeft)}
                        </span>)}
                    </div>
                )}
            </div>
            <div className="space-y-3">
                <p className="font-medium">
                    <span className="text-gray-600">Proposer ID:</span>{' '}
                    {proposer !== undefined ? `${proposer}` : "Waiting for proposer..."}
                </p>
                {question ? (
                    <div className="bg-blue-50 p-4 rounded-md">
                        <p className="font-medium text-blue-900">
                            Question: {question[0]} + {question[1]} = ?
                        </p>
                        <p className="mt-2 font-medium text-blue-900">
                            {((proposedAnswer !== undefined) && currentPhase === "b") ? `Proposed Answer : ` + proposedAnswer : ""}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500 italic"></p>
                )}

                {/* No Block Proposed Message */}
                {currentPhase === "c" && noBlockProposed && (
                    <div className="no-block-proposed bg-red-50 p-4 rounded-md text-red-800">
                        <p className="font-bold">Proposer did not propose the block.</p>
                    </div>
                )}

                {/* Voting Summary for Results Phase */}
                {currentPhase === "c" && !noBlockProposed && (
                    <div className="voting-summary bg-gray-50 p-4 rounded-md mt-4">
                        <p>
                            <strong>Question: </strong>{ }
                            {rquestion.length >= 0
                                ? rquestion.map(s => `${s}`).join('+ ')
                                : 'None'}
                        </p>
                        <p>
                            <strong>Answer: </strong>{rproposerAns}
                        </p>
                        <p>
                            <strong>Timestamp: </strong>{rTimeStamp}
                        </p>
                        <p>
                            <strong>Supporters:</strong>{ }
                            {supporters.length >= 0
                                ? `[` + supporters.map(s => `${s}`).join(', ') + `]`
                                : 'None'}
                        </p>
                        <p>
                            <strong>Opposers:</strong>{ }
                            {opposers.length > 0
                                ? `[` + opposers.map(o => `${o}`).join(', ') + ']'
                                : '[]'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrentBlock;