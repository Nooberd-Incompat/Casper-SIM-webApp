import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BlockTimeline = ({ onSelectBlock }) => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);

    useEffect(() => {
        const socket = io(`${process.env.REACT_APP_BACKEND_URL}`); // Ensure backend is running on this URL

        // Listen for block updates from backend
        socket.on('block_update', (newBlock) => {
            setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleBlockClick = (block) => {
        setSelectedBlock(block);
        onSelectBlock(block); // Pass the selected block to parent component
    };

    return (
        <div className="block-timeline">
            {blocks.map((block, index) => (
                <div
                    key={index}
                    className={`block ${selectedBlock === block ? 'selected' : ''}`}
                    onClick={() => handleBlockClick(block)}
                >
                    Block {block.id}
                </div>
            ))}
        </div>
    );
};

export default BlockTimeline;
