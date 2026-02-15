const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple Model (In-memory representation for a demo)
const species = [
    { id: 1, name: 'Giant Squid', depth: '1000m', status: 'Mysterious' },
    { id: 2, name: 'Anglerfish', depth: '2000m', status: 'Predatory' },
    { id: 3, name: 'Dumbo Octopus', depth: '3000m', status: 'Cute' }
];

// Routes
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Deep Sea Explorer API!", version: "1.0.0" });
});

app.get('/species', (req, res) => {
    res.json(species);
});

app.get('/health', (req, res) => {
    res.status(200).send('Submarine Systems Operational');
});

// Port Execution
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Deep Sea Explorer listening at http://localhost:${port}`);
    });
}

module.exports = app;
