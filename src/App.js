import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';
import BotView from './BotView';

// Create a context for the socket
export const SocketContext = createContext(null);

// Create socket connection with error handling
const createSocketConnection = () => {
    const socket = io(process.env.REACT_APP_BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

function App() {
    const [socket, setSocket] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        const newSocket = createSocketConnection();

        newSocket.on('connect', () => {
            //
            setIsConnecting(false);
            setConnectionError(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setIsConnecting(false);
            setConnectionError('Failed to connect to server. Please try again later.');
        });

        newSocket.on('disconnect', () => {
            //
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            //
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    if (isConnecting) {
        return (
            <div className="app-loading">
                <h2>Connecting to server...</h2>
            </div>
        );
    }

    if (connectionError) {
        return (
            <div className="app-error">
                <h2>Connection Error</h2>
                <p>{connectionError}</p>
                <button onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <SocketContext.Provider value={socket}>
            <Router>
                <Routes>
                    {/* Redirect root to a default bot ID or landing page */}
                    <Route
                        path="/"
                        element={<Navigate to="/welcome" replace />}
                    />

                    {/* Optional welcome/landing page */}
                    <Route
                        path="/welcome"
                        element={
                            <div className="welcome-page">
                                <h1>Casper PoS Simulation</h1>
                                <p>Enter a bot ID in the URL to begin (e.g., /0, /1, /2, etc.)</p>
                            </div>
                        }
                    />

                    {/* Bot view route */}
                    <Route
                        path="/:botId"
                        element={<BotView />}
                    />

                    {/* Catch all route for 404s */}
                    <Route
                        path="*"
                        element={
                            <div className="not-found">
                                <h2>404: Page Not Found</h2>
                                <p>The requested page does not exist.</p>
                            </div>
                        }
                    />
                </Routes>
            </Router>
        </SocketContext.Provider>
    );
}

export default App;
