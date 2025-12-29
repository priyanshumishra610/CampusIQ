const express = require('express');
const pool = require('../database/connection');
const {GoogleGenerativeAI} = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini
const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;
const model = genAI ? genAI.getGenerativeModel({model: 'gemini-pro'}) : null;

// Chat with AI
router.post('/chat', async (req, res) => {
  try {
    const {message, conversationHistory} = req.body;
    const userId = req.user.id;

    if (!model) {
      return res.status(503).json({error: 'AI service not configured'});
    }

    // Build conversation context
    const systemPrompt = `You are CampusIQ, an intelligent assistant for a college campus management system. 
You help students, faculty, and staff with academic queries, campus information, and administrative tasks.
Be helpful, concise, and professional.`;

    let fullPrompt = systemPrompt + '\n\n';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    fullPrompt += `User: ${message}\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Save to chat logs
    await pool.query(
      `INSERT INTO ai_chat_logs (user_id, message, response, model, created_at)
       VALUES ($1, $2, $3, 'gemini', CURRENT_TIMESTAMP)`,
      [userId, message, response]
    );

    res.json({
      response,
      model: 'gemini',
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({error: 'Failed to process AI request'});
  }
});

// Get chat history
router.get('/chat-history', async (req, res) => {
  try {
    const {limit = 50} = req.query;
    const result = await pool.query(
      `SELECT message, response, created_at FROM ai_chat_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json(result.rows.map(row => ({
      message: row.message,
      response: row.response,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({error: 'Failed to fetch chat history'});
  }
});

module.exports = router;

