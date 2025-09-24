
import React from 'react';
import { Recommendation } from '../../types';

interface MusicWidgetProps {
    recommendations: Recommendation[];
    onClose: () => void;
}

const MusicWidget: React.FC<MusicWidgetProps> = ({ recommendations, onClose }) => {
    return (
        <div className="bg-slate-800 p-4 rounded-lg w-80 relative shadow-lg text-white">
            <button onClick={onClose} className="absolute top-2 right-2 text-xl">&times;</button>
            <h4 className="font-bold mb-2">Music Recommendations</h4>
            <ul>
                {recommendations.map((rec, i) => (
                    <li key={i} className="truncate hover:text-violet-300">
                        <a href={rec.url} target="_blank" rel="noopener noreferrer">{rec.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MusicWidget;
