const fs = require('fs');

async function test() {
    try {
        console.log('Sending request to API...');
        const res = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "Experienced Software Engineer with 5 years in React and Node.js. Built a scalable backend that handled 1M requests per day. Familiar with Docker and AWS.",
                skills: ["React", "Node.js", "Docker", "AWS"],
                jobDescription: ""
            })
        });
        const data = await res.json();
        console.log('API Response received.');
        console.log('Has JobRecs?', !!data.jobRecommendations, data.jobRecommendations?.error ? 'ERROR: ' + data.jobRecommendations.message : '');
        console.log('Has Roadmap?', !!data.skillGapRoadmap, data.skillGapRoadmap?.error ? 'ERROR' : '');
        console.log('Has MockInterview?', !!data.mockInterview, data.mockInterview?.error ? 'ERROR: ' + data.mockInterview.message : '');
    } catch(err) {
        console.error('Test failed:', err.message);
    }
}
test();
