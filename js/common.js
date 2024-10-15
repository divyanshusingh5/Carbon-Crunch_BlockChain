import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler = async (req, res) => {
  // Check if the API key is set
  if (!process.env.OPENAI_API_KEY) {
    return res.status(401).json({
      error: 'OPENAI_API_KEY not set. Please set the key in your environment and redeploy the app to use this endpoint',
    });
  }

  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Only POST method allowed',
    });
  }

  // Validate if the request contains a prompt
  if (!req.body.prompt) {
    return res.status(400).json({
      error: 'Request body must contain a prompt',
    });
  }

  try {
    const input = req.body.prompt;

    // Create a chat completion request
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Assuming you meant 'gpt-3.5-turbo' or another valid model
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides HTML code with inline CSS styling.' },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const completion = response.choices[0].message.content.trim();

    return res.status(200).json({ completion });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'OpenAI API rate limit exceeded' });
    }

    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

export default handler;
