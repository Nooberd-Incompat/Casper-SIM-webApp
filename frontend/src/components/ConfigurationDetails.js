import React, { useState, useEffect } from 'react';

const ConfigurationDetails = () => {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/get-configs`)
            .then(response => response.json())
            .then(data => setConfig(data));
    }, []);

    if (!config) return <div>Loading configuration...</div>;

    const configItems = [
        { label: 'Proposer Time', value: `${config.proposer_time} s` },
        { label: 'Validator Time', value: `${config.validator_time} s` },
        { label: 'Results Time', value: `${config.publish_results_time} s` },
        { label: 'Total Stakeholders', value: config.no_of_stake_holders },
        { label: 'Required Confirmations', value: `${config.required_fraction_of_confirmations * 100}%` },
        { label: 'Initial Stake', value: config.init_stake },
        { label: 'Validator Penalty', value: config.validator_penalty },
        { label: 'Validator Reward', value: config.validator_reward },
        { label: 'Proposer Penalty', value: config.proposer_penalty },
        { label: 'Proposer Reward', value: config.proposer_reward },
        { label: 'No.of Validators', value: config.no_of_validators }
    ];

    return (
        <div className="bg-white border rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Network Configuration</h3>
            <div className="grid grid-cols-2 gap-2">
                {configItems.map((item, index) => (
                    <div key={index} className="flex justify-between border-b py-1">
                        <span className="font-medium text-sm">{item.label}: </span>
                        <span className="text-sm text-gray-600">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConfigurationDetails;