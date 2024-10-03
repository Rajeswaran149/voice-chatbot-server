const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gTTS = require('gtts'); 
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({origin:"*"}));

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { text } = req.body;
    console.log("Received message:", text);

    try {
        const run = async () => {
            const prompt = text;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const generatedText = await response.text();
            console.log("Generated response:", generatedText);
            return generatedText;
        };

        const generatedText = await run();
        const audioUrl = await textToSpeech(generatedText);
        
        res.send({ response: generatedText, audioUrl });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).send({
           error: 'Error occurred while processing the request',
           details: error.message,
           stack: error.stack,
        });
    }
});

// Text-to-Speech function
const textToSpeech = (text) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'output.mp3'); // Path for the audio file
        const speech = new gTTS(text, 'en'); // Create a new gTTS instance

        speech.save(filePath, (err) => {
            if (err) {
                console.error('Error generating speech:', err);
                return reject(err);
            }
            // Resolve with the file path
            resolve(`http://localhost:${port}/output.mp3`);
        });
    });
};

// Serve the audio file
app.use(express.static('.')); // Serve files in the root directory



// Health Check Endpoint
app.get("/", (req, res) => {
    res.send("Server is running successfully!");
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
