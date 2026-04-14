// ============================================================
// GitHub Portfolio Service
// Fetches GitHub repositories and uses Gemini to generate resume
// bullet points out of the repository metadata.
// ============================================================

import { getModel } from './geminiService.js';

/**
 * Fetch a user's repositories from GitHub API
 */
async function fetchGithubRepos(username) {
    try {
        const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`;

        // Use GitHub token if configured (raises limit from 60/hr to 5000/hr)
        const headers = {
            'User-Agent': 'ResumeAI-Tracker',
            'Accept': 'application/vnd.github.v3+json'
        };
        const token = process.env.GITHUB_TOKEN;
        if (token && token.trim()) {
            headers['Authorization'] = `Bearer ${token.trim()}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 404) throw new Error("GitHub user not found.");
            if (response.status === 403) throw new Error("GitHub API rate limit exceeded.");
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Map down to necessary fields to save LLM context
        return data.map(repo => ({
            name: repo.name,
            description: repo.description || 'No description',
            language: repo.language || 'Unknown',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            topics: repo.topics || [],
            url: repo.html_url
        })).filter(repo => !repo.fork); // exclude forks

    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Feed repos to Gemini to generate resume bullets
 */
export async function analyzeGitHubPortfolio(username) {
    try {
        const repos = await fetchGithubRepos(username);

        if (!repos || repos.length === 0) {
            return {
                error: true,
                message: "No public repositories found for this user."
            };
        }

        const model = getModel();
        if (!model) {
            return {
                error: true,
                message: "Gemini AI is not initialized."
            };
        }

        const prompt = `You are an expert Resume Writer and Technical Recruiter. 
I am going to provide you with a developer's top recently updated GitHub repositories.
I want you to analyze their tech stack, their open source contributions, and their coding focus, and then generate 3 to 5 highly professional, ATS-optimized "Experience / Projects" bullet points that they could copy directly into their resume. Include metrics if possible (like stars/forks).

## GitHub Username: ${username}
## Repositories:
${JSON.stringify(repos.slice(0, 8), null, 2)}

Respond with a JSON object ONLY:
{
    "summary": "<string: A 1-sentence summary of their open source profile>",
    "topLanguages": ["<string>", "<string>"],
    "resumeBullets": [
        "bullet 1",
        "bullet 2",
        "bullet 3"
    ]
}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Parse JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];
        
        const aiAnalysis = JSON.parse(text);
        
        return {
            success: true,
            username,
            reposCount: repos.length,
            ...aiAnalysis
        };

    } catch (error) {
        console.error("Github Portfolio Analysis Error:", error.message);
        return {
            error: true,
            message: error.message
        };
    }
}
