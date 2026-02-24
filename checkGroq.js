// test_groq_stream.js
// Standalone script to test Groq API streaming with a large question prompt.
// Run with: node test_groq_stream.js
// Make sure to set your GROQ_API_KEY in .env or hardcode it (not recommended).

require('dotenv').config();
const Groq = require('groq-sdk');

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error('Error: GROQ_API_KEY not set in .env');
  process.exit(1);
}

const chatHistory = [
  {
    role: 'system',
    content: `You are an elite Senior Staff Engineer and Lead Technical Interviewer. Mentor for top-tier roles.
DSA: LeetCode Medium/Hard. Discuss complexity first.
System Design: Scalability, DBs, security.
Behavioral: STAR method.
Tone: Professional, concise, rigorous.`
  },
  {
    role: 'user',
    content: `This is a big, detailed question to test streaming: Explain in depth how to design a scalable social media platform like Twitter (now X), including backend architecture, database choices, handling real-time updates, user authentication, feed generation, search functionality, and handling high traffic with millions of users. Discuss trade-offs for relational vs NoSQL databases, how to implement sharding, caching strategies with Redis, message queues for async tasks, WebSocket for real-time, and security measures against common attacks like SQL injection or DDoS. Also, cover frontend considerations with React, state management, and optimization for mobile. Finally, analyze the time and space complexity for key operations like posting a tweet or loading a feed. Provide code snippets where relevant for algorithms like feed ranking. Make the response comprehensive but structured.`
  }
];

async function testGroqStream() {
  console.log('Starting Groq stream test with large question...');

  const groq = new Groq({ apiKey: groqApiKey });

  try {
    const stream = await groq.chat.completions.create({
      messages: chatHistory,
      model: 'llama-3.1-8b-instant',
      stream: true,
      temperature: 0.7
    });

    console.log('Stream created. Waiting for chunks...');

    let fullAnswer = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        console.log('Chunk received:', delta);  // Log each stream chunk to observe streaming
        fullAnswer += delta;
      }
    }

    console.log('\nStream complete. Full response:');
    console.log(fullAnswer);
  } catch (err) {
    console.error('Groq Error:', err);
  }
}

testGroqStream();