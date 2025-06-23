 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Chatbox.css';

const Chatbot = () => {
  // State declarations
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '👋 Hello! I can help you find recipes.\n\nTry:\n- "Recipe for biryani"\n- "I have chicken, rice, tomatoes"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const [vegetarianFilter, setVegetarianFilter] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [timer, setTimer] = useState(null);
  const timerIntervalRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [isNewSearch, setIsNewSearch] = useState(true);

  // Auto-scroll logic
 const scrollToBottom = useCallback(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, []);

  // Handle scrolling on new messages
  useEffect(() => {
    if (isNewSearch) {
      const timer = setTimeout(() => {
        scrollToBottom();
        setIsNewSearch(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isNewSearch, scrollToBottom]);

  // Load data from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('recipeFavorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

    const savedMealPlan = localStorage.getItem('mealPlan');
    if (savedMealPlan) setMealPlan(JSON.parse(savedMealPlan));

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e) => {
        setInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error', e.error);
        setIsListening(false);
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: '❌ Sorry, I had trouble understanding your voice. Please try typing instead.'
        }]);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '🎤 Listening... Speak now!'
      }]);
    }
  };

  const toggleFavorite = (recipe) => {
    const isFavorite = favorites.some(fav => fav.name === recipe.name);
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.name !== recipe.name));
    } else {
      setFavorites([...favorites, recipe]);
    }
  };

  const addToMealPlan = (recipe) => {
    if (mealPlan.some(item => item.name === recipe.name)) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `⚠️ "${recipe.name}" is already in your meal plan!`
      }]);
    } else {
      setMealPlan([...mealPlan, recipe]);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `✅ Added "${recipe.name}" to your meal plan!`
      }]);
    }
  };

  const removeFromMealPlan = (recipeName) => {
    setMealPlan(mealPlan.filter(item => item.name !== recipeName));
  };

  const generateGroceryList = () => {
    const allIngredients = mealPlan.flatMap(recipe => recipe.ingredients);
    const uniqueIngredients = [...new Set(allIngredients)];
    return uniqueIngredients;
  };

  const startTimer = (minutes) => {
    const seconds = minutes * 60;
    setTimer(seconds);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          speak('Timer completed!');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    speak(`Timer set for ${minutes} minutes`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const shareRecipe = (recipe) => {
    if (navigator.share) {
      navigator.share({
        title: recipe.name,
        text: `Check out this recipe: ${recipe.name}`,
        url: recipe.url || window.location.href,
      }).catch(err => {
        console.log('Error sharing:', err);
        copyToClipboard(recipe.url || window.location.href);
      });
    } else {
      copyToClipboard(recipe.url || window.location.href);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: '🔗 Recipe link copied to clipboard!'
    }]);
  };

  const formatRecipeResponse = (recipes, endpoint) => {
    if (recipes.length === 0) {
      return {
        sender: 'bot',
        text: '🔍 No recipes found. Try:\n- Fewer ingredients\n- Different keywords\n- "Recipe for pasta"'
      };
    }

    if (endpoint.includes('name')) {
      const recipe = recipes[0];
      return {
        sender: 'bot',
        text: `🍳 ${recipe.name}`,
        image: recipe.image,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        isVegetarian: recipe.isVegetarian,
        calories: recipe.calories,
        protein: recipe.protein,
        video: recipe.video
      };
    } else {
      return {
        sender: 'bot',
        text: `🍳 Found ${recipes.length} recipe(s):`,
        recipes: recipes.map((r) => ({
          name: r.name,
          image: r.image,
          url: r.url,
          ingredients: r.ingredients,
          isVegetarian: r.isVegetarian,
          calories: r.calories,
          protein: r.protein,
          video: r.video
        })),
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsNewSearch(true);
    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      let endpoint, body;
      if (input.toLowerCase().includes('recipe for') || input.toLowerCase().includes('how to make')) {
        const dishName = input.replace('recipe for', '').replace('how to make', '').trim();
        endpoint = '/api/recipe/name';
        body = { 
          query: dishName,
          filters: {
            vegetarian: vegetarianFilter,
            difficulty: activeFilter === 'easy' ? 'easy' : 
                      activeFilter === 'medium' ? 'medium' : 
                      activeFilter === 'hard' ? 'hard' : null,
            time: activeFilter === 'quick' ? '<30' : null
          }
        };
      } else {
        endpoint = '/api/recipe/ingredients';
        body = {
          ingredients: input.split(',').map(i => i.trim()),
          filters: {
            vegetarian: vegetarianFilter,
            difficulty: activeFilter === 'easy' ? 'easy' : 
                      activeFilter === 'medium' ? 'medium' : 
                      activeFilter === 'hard' ? 'hard' : null,
            time: activeFilter === 'quick' ? '<30' : null
          }
        };
      }

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      
      const data = await response.json();
      const botMsg = formatRecipeResponse(data, endpoint);
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: `❌ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    
    <div className={`chatbot-container ${darkMode ? 'dark-mode' : ''}`}>
       
      

       

      {/* Main Chatbot Interface */}
      <div className="chatbot">
        <div className="chatbot-header">
          <div className="header-top">
            <h1> QuickBite AI</h1>
            
            
            <button onClick={toggleDarkMode} className="dark-mode-toggle">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <p><h4>Ingredient to Recipe Finder</h4></p>
          <p>Tell me what you're craving or what ingredients you have!</p>
          
          <div className="filters">
            <div className="filter-group">
              <span>Diet:</span>
              <button 
                onClick={() => setVegetarianFilter(null)} 
                className={vegetarianFilter === null ? 'active' : ''}
              >
                All
              </button>
              <button 
                onClick={() => setVegetarianFilter(true)} 
                className={vegetarianFilter === true ? 'active' : ''}
              >
                Vegetarian
              </button>
              <button 
                onClick={() => setVegetarianFilter(false)} 
                className={vegetarianFilter === false ? 'active' : ''}
              >
                Non-Veg
              </button>
            </div>
            
            <div className="filter-group">
              <span>Type:</span>
              <button 
                onClick={() => setActiveFilter('all')} 
                className={activeFilter === 'all' ? 'active' : ''}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('easy')} 
                className={activeFilter === 'easy' ? 'active' : ''}
              >
                Easy
              </button>
              <button 
                onClick={() => setActiveFilter('medium')} 
                className={activeFilter === 'medium' ? 'active' : ''}
              >
                Medium
              </button>
              <button 
                onClick={() => setActiveFilter('hard')} 
                className={activeFilter === 'hard' ? 'active' : ''}
              >
                Hard
              </button>
              {/* <button 
                onClick={() => setActiveFilter('quick')} 
                className={activeFilter === 'quick' ? 'active' : ''}
              >
                Quick
              </button> */}
            </div>
          </div>
        </div>

        <div className="chatbot-sidebar">
          <div className="sidebar-top">
            <div className="sidebar-section favorites">
              <h3>⭐ Favorites ({favorites.length})</h3>
              {favorites.length > 0 ? (
                <div className="favorites-list">
                  {favorites.map((fav, i) => (
                    <div key={i} className="favorite-item">
                      <span>{fav.name}</span>
                      <button onClick={() => toggleFavorite(fav)}>❌</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No favorites yet</p>
              )}
            </div>

            <div className="sidebar-section meal-plan">
              <div className="meal-plan-header">
                <h3>📅 Meal Plan ({mealPlan.length})</h3>
                <button 
                  onClick={() => setShowGroceryList(!showGroceryList)}
                  className="grocery-list-button"
                >
                  {showGroceryList ? 'Hide' : 'Show'} Grocery List
                </button>
              </div>

              {showGroceryList ? (
                <div className="grocery-list">
                  <h4>🛒 Grocery List</h4>
                  {generateGroceryList().length > 0 ? (
                    <ul>
                      {generateGroceryList().map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Add recipes to your meal plan first</p>
                  )}
                </div>
              ) : (
                <>
                  {mealPlan.length > 0 ? (
                    <div className="meal-plan-list">
                      {mealPlan.map((item, i) => (
                        <div key={i} className="meal-plan-item">
                          <span>{item.name}</span>
                          <button onClick={() => removeFromMealPlan(item.name)}>❌</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No meals planned yet</p>
                  )}
                </>
              )}
            </div>
          </div>

          {timer !== null && (
            <div className="timer-display">
              <h3>⏱️ Timer</h3>
              <div className="timer">{formatTime(timer)}</div>
              <button 
                onClick={() => {
                  clearInterval(timerIntervalRef.current);
                  setTimer(null);
                }}
                className="timer-cancel"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="chatbot-messages" ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br /></React.Fragment>
                ))}

                {msg.image && (
                  <img src={msg.image} alt="Recipe" className="recipe-image" />
                )}

                {msg.instructions && (
                  <div className="recipe-section">
                    <h4>Instructions:</h4>
                    <p>{msg.instructions}</p>
                    {msg.instructions.toLowerCase().includes('minutes') && (
                      <button 
                        onClick={() => {
                          const minutesMatch = msg.instructions.match(/(\d+)\s*minutes?/i);
                          if (minutesMatch) {
                            startTimer(parseInt(minutesMatch[1]));
                          }
                        }}
                        className="timer-button"
                      >
                        ⏱️ Start Timer
                      </button>
                    )}
                  </div>
                )}

                {msg.ingredients && (
                  <div className="recipe-section">
                    <h4>Ingredients:</h4>
                    <ul>
                      {msg.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(msg.calories || msg.protein) && (
                  <div className="nutrition-info">
                    {msg.calories && <span>🔥 {msg.calories} kcal</span>}
                    {msg.protein && <span>🍗 {msg.protein}g protein</span>}
                  </div>
                )}

                {msg.recipes?.map((recipe, i) => (
                  <div key={i} className="recipe-card">
                    <div className="recipe-card-header">
                      {recipe.isVegetarian !== undefined && (
                        <span className={`veg-tag ${
                          recipe.isVegetarian ? 'vegetarian' : 'non-vegetarian'
                        }`}>
                          {recipe.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                        </span>
                      )}
                      {(recipe.calories || recipe.protein) && (
                        <div className="recipe-nutrition">
                          {recipe.calories && <span>🔥 {recipe.calories}kcal</span>}
                          {recipe.protein && <span>🍗 {recipe.protein}g</span>}
                        </div>
                      )}
                    </div>
                    
                    <img src={recipe.image} alt={recipe.name} className="recipe-thumbnail" />
                    <div className="recipe-info">
                      <h4>{recipe.name}</h4>
                      
                      <div className="recipe-actions">
                        <button 
                          onClick={() => toggleFavorite(recipe)}
                          className={`favorite-button ${
                            favorites.some(fav => fav.name === recipe.name) ? 'favorited' : ''
                          }`}
                        >
                          {favorites.some(fav => fav.name === recipe.name) ? '❤️' : '🤍'}
                        </button>
                        
                        <button 
                          onClick={() => addToMealPlan(recipe)}
                          className="meal-plan-button"
                        >
                          📅
                        </button>
                        
                        {recipe.url && (
                          <a 
                            href={recipe.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="recipe-link"
                          >
                            View Recipe
                          </a>
                        )}
                        
                        <button 
                          onClick={() => shareRecipe(recipe)}
                          className="share-button"
                        >
                          ↗️ Share
                        </button>
                      </div>
                      
                      {recipe.video && (
                        <a 
                          href={recipe.video} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="video-link"
                        >
                          ▶️ Watch Video Tutorial
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <div className="message-content typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Try: 'Recipe for pasta' or 'I have eggs, flour'"
            className="input-field"
          />
          {/* <button
            onClick={startListening}
            disabled={isListening || loading}
            className={`voice-button ${isListening ? 'listening' : ''}`}
          >
            {isListening ? <div className="pulse-animation">🎤</div> : '🎤'}
          </button> */}
           <button
  onClick={startListening}
  disabled={isListening || loading}
  className={`voice-button ${isListening ? 'listening' : ''}`}
>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 18v3h2v-3h-2z" />
  </svg>
</button>


          <button
            onClick={handleSend}
            disabled={loading || isListening}
            className="send-button"
          >
            {loading ? <div className="spinner"></div> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;