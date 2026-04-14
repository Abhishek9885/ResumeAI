import { Router } from 'express';
import { analyzeGitHubPortfolio } from '../services/githubService.js';

const router = Router();

router.post('/github', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: "GitHub username is required" });
    }

    try {
        const result = await analyzeGitHubPortfolio(username);
        if (result.error) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error("Route /api/portfolio/github error:", error);
        res.status(500).json({ error: "Failed to process portfolio." });
    }
});

export default router;
