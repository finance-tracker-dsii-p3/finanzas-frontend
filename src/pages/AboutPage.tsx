import React from 'react';
import './AboutPage.css';

export const AboutPage: React.FC = () => {
    return (
        <div className="aboutpage-container">
            <div className="aboutpage-header">
                <h1 className="aboutpage-title">About Us</h1>
                <p className="aboutpage-content">Información sobre nuestra aplicación de gestión financiera.</p>
            </div>
        </div>
    );
};
