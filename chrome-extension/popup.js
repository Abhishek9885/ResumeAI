document.addEventListener('DOMContentLoaded', function() {
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('resume-upload');
  var btnScan = document.getElementById('btn-scan');
  var btnReset = document.getElementById('btn-reset');
  var dropzoneMain = document.getElementById('dropzone-main');
  var dropzoneSub = document.getElementById('dropzone-sub');
  
  var uploadView = document.getElementById('upload-view');
  var loadingView = document.getElementById('loading-view');
  var resultsView = document.getElementById('results-view');
  var loadingText = document.getElementById('loading-text');

  var selectedFile = null;

  // Handles updating the UI without destroying the file input element
  function handleFileSelect(file) {
    if (!file) return;
    selectedFile = file;
    dropzoneMain.innerHTML = '✓ ' + selectedFile.name;
    dropzoneMain.style.color = '#00e676';
    dropzoneSub.style.display = 'none';
    dropzone.style.borderColor = '#00e676';
    btnScan.disabled = false;
  }

  // File input change handler (fires whenever a file is selected)
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Handle Scan Button
  btnScan.addEventListener('click', async function() {
    if (!selectedFile) return;

    uploadView.style.display = 'none';
    loadingView.style.display = 'block';

    try {
      // 1. Get JD from active tab
      loadingText.innerText = "Extracting Job Data from page...";
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      var tab = tabs[0];
      
      var injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      var jdText = "";
      if (injectionResults && injectionResults[0].result) {
        jdText = injectionResults[0].result;
      }
      
      if (!jdText || jdText.length < 50) {
        throw new Error("Could not find a valid Job Description on this page.");
      }

      // 2. Send to backend
      loadingText.innerText = "Analyzing JD vs Resume...";
      var formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('jobDescription', jdText);

      var response = await fetch('https://resumeai-sck8.onrender.com/api/analyze/quick', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Server offline?");
      }

      var data = await response.json();
      
      // 3. Render Results
      loadingView.style.display = 'none';
      resultsView.style.display = 'block';
      
      var llm = data.llmAnalysis;
      var ats = data.atsScore;
      var statsDiv = document.querySelector('.stats');
      
      if (llm && llm.jdMatch && !llm.error) {
        var jd = llm.jdMatch;
        document.getElementById('match-score').innerText = jd.matchScore || ats.score;
        document.getElementById('match-level').innerText = jd.matchLevel || "Analyzed";
        document.getElementById('match-summary').innerText = jd.matchSummary || "";
        document.getElementById('match-count').innerText = (jd.matchedSkills || []).length;
        document.getElementById('missing-count').innerText = (jd.missingSkills || []).length;
        if(statsDiv) statsDiv.style.display = 'flex';
      } else {
        document.getElementById('match-score').innerText = ats.score;
        document.getElementById('match-level').innerText = ats.gradeLabel;
        document.getElementById('match-summary').innerText = "⚠️ Google AI rate limit reached (too many fast scans). Showing base ATS Quality Score. Try again in 1-2 minutes.";
        if(statsDiv) statsDiv.style.display = 'none';
      }
      
    } catch (err) {
      alert(err.message);
      loadingView.style.display = 'none';
      uploadView.style.display = 'block';
    }
  });

  // Reset functionality
  btnReset.addEventListener('click', function() {
    resultsView.style.display = 'none';
    uploadView.style.display = 'block';
    
    // Reset state
    selectedFile = null;
    fileInput.value = ""; // Clear file input natively
    
    // Reset UI
    dropzoneMain.innerHTML = 'Drop your Resume (PDF/DOCX)';
    dropzoneMain.style.color = 'inherit';
    dropzoneSub.style.display = 'block';
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    btnScan.disabled = true;
  });
});
