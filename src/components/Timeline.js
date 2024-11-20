import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../App';
import './Timeline.css';

const Timeline = ({ onSelectBlock, refreshTrigger }) => {
    const [blocksData, setBlocksData] = useState([]);
    const socket = useContext(SocketContext);

    const fetchBlocks = async () => {
        try {
            const response = await fetch('http://localhost:5000/get-block-history');
            const data = await response.json();
            setBlocksData(data.reverse()); // New blocks on top
        } catch (error) {
            console.error("Error fetching block data:", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchBlocks();
    }, []);

    // Refresh trigger effect
    useEffect(() => {
        if (refreshTrigger === 'a') {
            fetchBlocks();
        }
    }, [refreshTrigger]);

    // Socket listener for real-time updates
    useEffect(() => {
        const handleBlockHistory = (data) => {
            if (data.msg === 'publish_results') {
                setBlocksData(prevBlocks => [...data].reverse());
            }
        };

        // socket.on('get-block-history', handleBlockHistory);

        // // Cleanup listener
        // return () => {
        //     socket.off('get-block-history', handleBlockHistory);
        // };
    }, [socket]);

    return (
        <div className="timeline">
            <h2>Timeline of Blocks</h2>
            <div className="timeline-container">
                {blocksData.map((block, index) => (
                    <div
                        key={index}
                        className="block"
                        onClick={() => onSelectBlock(block)}
                    >
                        <h3>{block.time}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;