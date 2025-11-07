import React from "react";
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
    return (
        <nav>
            <Link to="/">Inicio</Link>
            <Link to="/about">Sobre nosotros</Link>
            <Link to="/profile">Perfil</Link>
        </nav>
    );
};