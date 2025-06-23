// pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader';

const HomePage = () => {
  return (
    <div className="home-page">
      <MobileHeader title="Let'sCook AI" />
      
      <div className="hero-section">
        <h1>Your AI Cooking Assistant</h1>
        <p>Find recipes, plan meals, and cook smarter</p>
        <Link to="/chat" className="cta-button">
          Start Chatting
        </Link>
      </div>
      
      <div className="feature-cards">
        <Link to="/recipes" className="feature-card">
          <h3>Recipe Finder</h3>
          <p>Discover thousands of recipes</p>
        </Link>
        
        <Link to="/meal-planner" className="feature-card">
          <h3>Meal Planner</h3>
          <p>Plan your weekly meals</p>
        </Link>
        
        <Link to="/favorites" className="feature-card">
          <h3>Your Favorites</h3>
          <p>Save your favorite recipes</p>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;