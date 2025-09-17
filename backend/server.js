  
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

// const port = 3000;
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// Helper: Extract ingredients from TheMealDB meal object
function getIngredientsList(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(`${ing} - ${measure}`);
    }
  }
  return ingredients;
}

// Detect if recipe is vegetarian
function detectIsVegetarian(ingredients, title = '') {
  const nonVegKeywords = [
    'chicken', 'beef', 'pork', 'mutton', 'lamb', 'turkey', 'duck',
    'fish', 'anchovy', 'anchovies', 'salmon', 'bacon', 'shrimp',
    'crab', 'egg', 'meat', 'stock', 'gravy', 'broth', 'ham', 'sausage'
  ];

  const combinedText = [...ingredients, title];
  return !combinedText.some(item =>
    nonVegKeywords.some(nonVeg =>
      item.toLowerCase().includes(nonVeg)
    )
  );
}

// Assign difficulty based on ingredients and instruction length
function getDifficulty(ingredients, instructions) {
  const numIngredients = ingredients.length;
  const instructionLength = instructions.split(/\s+/).length;

  if (numIngredients <= 5 && instructionLength < 100) return 'Easy';
  if (numIngredients <= 10 && instructionLength < 200) return 'Medium';
  return 'Hard';
}

// --- API 1: Search recipe by name (TheMealDB) ---
app.post('/api/recipe/name', async (req, res) => {
  try {
    const { query, filters } = req.body;

    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);

    if (!response.data.meals) {
      return res.json([]);
    }

    let recipes = response.data.meals.map(meal => {
      const ingredients = getIngredientsList(meal);
      const instructions = meal.strInstructions || '';
      const isVegetarian = detectIsVegetarian(ingredients, meal.strMeal);
      const difficulty = getDifficulty(ingredients, instructions);

      return {
        name: meal.strMeal,
        image: meal.strMealThumb,
        instructions,
        ingredients,
        isVegetarian,
        difficulty
      };
    });

    // Filter: Vegetarian
    if (filters && typeof filters.vegetarian === 'boolean') {
      recipes = recipes.filter(recipe =>
        filters.vegetarian ? recipe.isVegetarian : !recipe.isVegetarian
      );
    }

    // Filter: Difficulty
    if (filters && filters.difficulty) {
      recipes = recipes.filter(recipe =>
        recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
      );
    }

    res.json(recipes);
  } catch (error) {
    console.error('TheMealDB Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// --- API 2: Search recipe by ingredients (Edamam) ---
app.post('/api/recipe/ingredients', async (req, res) => {
  try {
    const { ingredients, filters } = req.body;

    const EDAMAM_APP_ID = "0922f282";
    const EDAMAM_APP_KEY = "0144401597882c3d6524467909b63c7d";
    const EDAMAM_ACCOUNT_USER = "ankikhr123";

    const response = await axios.get('https://api.edamam.com/api/recipes/v2', {
      headers: {
        'Edamam-Account-User': EDAMAM_ACCOUNT_USER
      },
      params: {
        type: 'public',
        q: ingredients.join(','),
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY
      }
    });

    let recipes = response.data.hits.map(hit => {
      const ingredientList = hit.recipe.ingredientLines;
      const instructions = hit.recipe.instructions || '';
      const isVegetarian = detectIsVegetarian(ingredientList, hit.recipe.label);
      const difficulty = getDifficulty(ingredientList, instructions);

      return {
        name: hit.recipe.label,
        image: hit.recipe.image,
        url: hit.recipe.url,
        ingredients: ingredientList,
        isVegetarian,
        difficulty
      };
    });

    // Filter: Vegetarian
    if (filters && typeof filters.vegetarian === 'boolean') {
      recipes = recipes.filter(recipe =>
        filters.vegetarian ? recipe.isVegetarian : !recipe.isVegetarian
      );
    }

    // Filter: Difficulty
    if (filters && filters.difficulty) {
      recipes = recipes.filter(recipe =>
        recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
      );
    }

    res.json(recipes);
  } catch (error) {
    console.error('Edamam Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch recipes from Edamam',
      details: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Recipe bot backend running at: http://localhost:${port}`);
});

