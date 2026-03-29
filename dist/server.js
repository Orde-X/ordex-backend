"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_client_1 = __importDefault(require("./core/database/prisma.client"));
const v1_1 = __importDefault(require("./core/routes/v1"));
const swagger_1 = require("./core/swagger");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use('/api/v1', v1_1.default);
(0, swagger_1.setupSwagger)(app);
// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Orde-X Backend API is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});
const startServer = async () => {
    try {
        await prisma_client_1.default.$connect();
        console.log("Connected to database");
        if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
    }
    catch (error) {
        console.log("Failed to start server!", error.message);
        if (process.env.NODE_ENV !== "production") {
            process.exit(1);
        }
    }
};
startServer();
exports.default = app;
