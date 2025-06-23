// components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUtensils, FaCalendarAlt, FaHeart, FaComments } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav className="mobile-nav">
      <Link to="/" className="nav-item">
        <FaHome />
        <span>Home</span>
      </Link>
      <Link to="/chat" className="nav-item">
        <FaComments />
        <span>Chat</span>
      </Link>
      <Link to="/recipes" className="nav-item">
        <FaUtensils />
        <span>Recipes</span>
      </Link>
      <Link to="/meal-planner" className="nav-item">
        <FaCalendarAlt />
        <span>Meal Plan</span>
      </Link>
      <Link to="/favorites" className="nav-item">
        <FaHeart />
        <span>Favorites</span>
      </Link>
    </nav>
  );
};

export default Navbar;