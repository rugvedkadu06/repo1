// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Note: dotenv is no longer required as the URI is hardcoded.
// You still need to install: npm install express mongoose cors

// --- Configuration & Initialization ---

const app = express();
const PORT = 5000; // Hardcoded port

// --- HARDCODED MONGO_URI ---
const MONGO_URI = "mongodb+srv://animeshtajne776_db_user:OWh4AWFsdd8mtz80@underdogs.el9psk5.mongodb.net/rakshawann01?retryWrites=true&w=majority&appName=underdogs";


// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors()); // Enable CORS for the Flutter application

// -----------------------------------------------------------------
// 1. Mongoose Schema and Model Definition
// -----------------------------------------------------------------

const { Schema, model } = mongoose;

const LocationSchema = new Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
}, { _id: false });

const PredictionSchema = new Schema({
    class: { type: String, required: true },
    confidence: { type: Number, required: true },
    situation: { type: String, required: true },
}, { _id: false });

const AIAlertSchema = new Schema({
    ALERT_TYPE: { type: String, required: true },
    SEVERITY: { type: String, required: true },
    MESSAGE: { type: String, required: true },
    ACTION_REQUIRED: { type: String, required: true },
}, { _id: false });

const AlertSchema = new Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    filename: {
        type: String,
        required: false
    },
    location: {
        type: LocationSchema,
        required: true
    },
    prediction: {
        type: PredictionSchema,
        required: true
    },
    ai_alert: {
        type: AIAlertSchema,
        required: true
    }
}, { 
    timestamps: true,
    collection: 'alerts' // Ensure this matches your MongoDB collection name
});

const Alert = model('Alert', AlertSchema);

// -----------------------------------------------------------------
// 2. MongoDB Connection
// -----------------------------------------------------------------

const connectDB = async () => {
    if (!MONGO_URI) {
        // This check is mostly symbolic now, as the URI is defined above.
        console.error("FATAL ERROR: MONGO_URI is missing.");
        process.exit(1);
    }
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- MongoDB connection established successfully. ---');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        // Exit process with failure
        process.exit(1);
    }
};

// -----------------------------------------------------------------
// 3. API Routes
// -----------------------------------------------------------------

// Health Check / Root Route
app.get('/', (req, res) => {
    res.status(200).send({ 
        message: "Wildlife Acoustic Alert API is running.",
        routes: {
            getAllAlerts: '/api/alerts (GET)',
            postNewAlert: '/api/alerts (POST)'
        }
    });
});


/**
 * GET /api/alerts
 * Fetches all acoustic alert documents, sorted by newest first.
 */
app.get('/api/alerts', async (req, res) => {
    try {
        // Find all alerts and sort by timestamp descending
        const alerts = await Alert.find().sort({ timestamp: -1 });

        // Transform the Mongoose documents to plain JSON objects for the frontend
        const transformedAlerts = alerts.map(alert => ({
            id: alert._id, 
            timestamp: alert.timestamp.toISOString(),
            filename: alert.filename,
            location: alert.location,
            prediction: alert.prediction,
            ai_alert: alert.ai_alert,
        }));
        
        res.status(200).json(transformedAlerts);

    } catch (error) {
        console.error("Error fetching alerts:", error.message);
        res.status(500).json({ message: "Server error fetching alerts.", error: error.message });
    }
});


/**
 * POST /api/alerts
 * Creates a new acoustic alert document.
 */
app.post('/api/alerts', async (req, res) => {
    try {
        // Mongoose validation and saving happens here
        const newAlert = new Alert(req.body);
        await newAlert.save();
        
        res.status(201).json({ 
            message: "Alert created successfully.",
            alertId: newAlert._id,
            alert: newAlert
        });
    } catch (error) {
        console.error("Error creating alert:", error.message);
        // Mongoose validation errors result in status 400 (Bad Request)
        res.status(400).json({ 
            message: "Invalid alert data. Check required fields.", 
            error: error.message 
        });
    }
});


// -----------------------------------------------------------------
// 4. Start Server
// -----------------------------------------------------------------

// Connect to the DB and then start the Express server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`To get alerts, visit http://localhost:${PORT}/api/alerts`);
    });
});