import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';
import Timeline from './components/Timeline';
import BlockDetails from './components/BlockDetails';
import CurrentBlock from './components/CurrentBlock';
import VotingMechanism from './components/VotingMechanism';
import StakeStatus from './components/StakeStatus';
import CurrentBlockProposal from './components/CurrentBlockProposal/CurrentBlockProposal';
import { io } from 'socket.io-client';
import ConfigurationDetails from './components/ConfigurationDetails';

// Create socket connection with error handling
const createSocketConnection = () => {
  const socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

function BotView() {
  const { botId } = useParams();
  const [socket, setSocket] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [currentPhase, setCurrentMode] = useState('a');
  const [validators, setValidators] = useState([]);
  const [proposerID, setProposerID] = useState(null);
  const [userRole, setUserRole] = useState('none');
  const [responseMessage, setResponseMessage] = useState('');
  const [isValidBot, setIsValidBot] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [question, setQuestion] = useState(null);
  const [proposedAnswer, setProposedAnswer] = useState(null);
  const [currMode, setCurrMode] = useState(null);

  useEffect(() => {
    const newSocket = createSocketConnection();
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !botId) return;

    const handleRegistrationResponse = (response) => {
      //
      if (response.code === 3) {
        setIsValidBot(true);
        setConnectionStatus('connected');
      } else {
        setResponseMessage(response.msg);
        setConnectionStatus('error');
      }
    };

    const handleServerMessage = (message) => {
      //
      if (message.proposer !== undefined) {
        setProposerID(message.proposer);
        setUserRole(message.proposer === parseInt(botId) ? 'proposer' : 'voter');
      }
      if (message.validators) {
        setValidators(message.validators);
        if (message.validators.includes(parseInt(botId))) {
          setUserRole('voter');
        }
      }
      if (message.question) {
        setQuestion(message.question);
      }
      if (message.proposedAnswer !== undefined) {
        setProposedAnswer(message.proposedAnswer);
      }
    };

    const handleMode = (modeData) => {
      setCurrentMode(modeData.code);
    };

    const handleRoundComplete = () => {
      setQuestion(null);
      setProposedAnswer(null);
    };

    // Set up event listeners
    socket.on('register-stake-holder-res', handleRegistrationResponse);
    socket.on('server_msg', handleServerMessage);
    socket.on('mode', handleMode);

    // Register the bot
    // //
    socket.emit('register-stake-holder', { _id: botId });

    return () => {
      socket.off('register-stake-holder-res', handleRegistrationResponse);
      socket.off('server_msg', handleServerMessage);
      socket.off('mode', handleMode);

      socket.emit('deregister-stake-holder', { _id: botId });
    };
  }, [socket, botId]);

  useEffect(() => {
    if (currentPhase !== 'a' && currentPhase !== 'b') {
      setQuestion(null);
      setProposedAnswer(null);
    }
  }, [currentPhase]);


  if (connectionStatus === 'connecting') {
    return <div>Connecting to server...</div>;
  }

  if (connectionStatus === 'error') {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{responseMessage}</p>
      </div>
    );
  }

  if (!isValidBot) {
    return (
      <div className="error-container">
        <h1>This bot is preoccupied or invalid.</h1>
        <p>{responseMessage}</p>
      </div>
    );
  }

  // //
  return (
    <div className="App">
      <div className="row title">
        <h1>Casper Proof Of Stake (PoS) Simulation</h1>
        <h2>Bot ID: {botId}</h2>
      </div>


      <div className="row">
        <div className="section s2">
          <CurrentBlock
            currentPhase={currentPhase}
            startTime={Date.now()}
            proposer={proposerID}
            question={question}
            proposedAnswer={proposedAnswer}
            currMode={currMode}
          />
        </div>
        <div className="section s2">
          <div className="role-info">
            <h3>Participants</h3>
            <p><strong>Proposer ID:</strong> {proposerID !== null ? ` ${proposerID}` : 'Selecting...'}</p>
            <p><strong>Validator IDs:</strong> {validators.length > 0 ? `[` + validators.map(v => `${v}`).join(', ') + `]` : 'Selecting...'}</p>
          </div>
        </div>
        <div className="section s2">
          {userRole === 'proposer' ? (
            <CurrentBlockProposal
              socket={socket}
              userId={proposerID}
              currentPhase={currentPhase}
            />
          ) : userRole === 'voter' ? (
            <VotingMechanism
              socket={socket}
              proposerID={proposerID}
              validators={validators}
              currentMode={currentPhase}
              currentValidatorId={Number(botId)}
              question={question}
              proposedAnswer={proposedAnswer}
            />
          ) : (
            <p>You are neither the proposer nor a validator for this round.</p>
          )}
        </div>
      </div>
      <div className="row">
        <div className="section">
          <ConfigurationDetails />
        </div>
        <div className="section">
          <Timeline onSelectBlock={setSelectedBlock} refreshTrigger={currentPhase} />
        </div>
        <div className="section">
          <BlockDetails block={selectedBlock} />
        </div>
        <div className="section">
          <StakeStatus botId={botId} socket={socket} />
        </div>
      </div>
    </div>
  );
}

export default BotView;