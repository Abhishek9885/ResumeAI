document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('resume-upload');
  const btnScan = document.getElementById('btn-scan');
  const btnReset = document.getElementById('btn-reset');
  
  const uploadView = document.getElementById('upload-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const loadingText = document.getElementById('loading-text');

  let selectedFile = null;

  // Setup file drop/click
  dropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      dropzone.innerHTML = \`<p style="color:#00e676">✓ \${selectedFile.name}</p>\`;
      dropzone.style.borderColor = '#00e676';
      btnScan.disabled = false;
    }
  });

  // Handle Scan Button
  btnScan.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadView.style.display = 'none';
    loadingView.style.display = 'block';

    try {
      // 1. Get JD from active tab
      loadingText.innerText = "Extracting Job Data from page...";
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      let jdText = "";
      if (injectionResults && injectionResults[0].result) {
        jdText = injectionResults[0].result;
      }
      
      if (!jdText || jdText.length < 50) {
        throw new Error("Could not find a valid Job Description on this page.");
      }

      // 2. Send to backend
      loadingText.innerText = "Analyzing JD vs Resume...";
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('jobDescription', jdText);

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Server offline?");
      }

      const data = await response.json();
      
      // 3. Render Results
      loadingView.style.display = 'none';
      resultsView.style.display = 'block';
      
      const llm = data.llmAnalysis;
      const ats = data.atsScore;
      
      if (llm && llm.jdMatch) {
        const jd = llm.jdMatch;
        document.getElementById('match-score').innerText = jd.matchScore || ats.score;
        document.getElementById('match-level').innerText = jd.matchLevel || "Analyzed";
        document.getElementById('match-summary').innerText = jd.matchSummary || "";
        document.getElementById('match-count').innerText = (jd.matchedSkills || []).length;
        document.getElementById('missing-count').innerText = (jd.missingSkills || []).length;
      } else {
        document.getElementById('match-score').innerText = ats.score;
        document.getElementById('match-level').innerText = ats.gradeLabel;
      }
      
    } catch (err) {
      alert(err.message);
      loadingView.style.display = 'none';
      uploadView.style.display = 'block';
    }
  });

  // Reset
  btnReset.addEventListener('click', () => {
    resultsView.style.display = 'none';
    uploadView.style.display = 'block';
    selectedFile = null;
    fileInput.value = "";
    dropzone.innerHTML = \`<p>Drop your Resume (PDF/DOCX)</p><p class="sub">or click to select</p>\`;
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    btnScan.disabled = true;
  });
});
