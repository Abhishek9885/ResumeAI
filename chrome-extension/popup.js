document.addEventListener('DOMContentLoaded', function() {
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('resume-upload');
  var btnScan = document.getElementById('btn-scan');
  var btnReset = document.getElementById('btn-reset');
  
  var uploadView = document.getElementById('upload-view');
  var loadingView = document.getElementById('loading-view');
  var resultsView = document.getElementById('results-view');
  var loadingText = document.getElementById('loading-text');

  var selectedFile = null;

  // File input change handler
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      dropzone.innerHTML = '<p style="color:#00e676">✓ ' + selectedFile.name + '</p>' +
        '<input type="file" id="resume-upload" accept=".pdf,.docx,.txt" style="position:absolute;width:100%;height:100%;opacity:0;cursor:pointer;top:0;left:0;">';
      dropzone.style.borderColor = '#00e676';
      btnScan.disabled = false;
      // Re-bind the new file input
      var newInput = document.getElementById('resume-upload');
      newInput.addEventListener('change', function(ev) {
        if (ev.target.files.length > 0) {
          selectedFile = ev.target.files[0];
          document.querySelector('#dropzone p').textContent = '✓ ' + selectedFile.name;
        }
      });
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
      
      if (llm && llm.jdMatch) {
        var jd = llm.jdMatch;
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
  btnReset.addEventListener('click', function() {
    resultsView.style.display = 'none';
    uploadView.style.display = 'block';
    selectedFile = null;
    dropzone.innerHTML = '<p>Drop your Resume (PDF/DOCX)</p><p class="sub">or click to select</p>' +
      '<input type="file" id="resume-upload" accept=".pdf,.docx,.txt" style="position:absolute;width:100%;height:100%;opacity:0;cursor:pointer;top:0;left:0;">';
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    btnScan.disabled = true;
    // Re-bind file input after reset
    var resetInput = document.getElementById('resume-upload');
    resetInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        dropzone.innerHTML = '<p style="color:#00e676">✓ ' + selectedFile.name + '</p>' +
          '<input type="file" id="resume-upload" accept=".pdf,.docx,.txt" style="position:absolute;width:100%;height:100%;opacity:0;cursor:pointer;top:0;left:0;">';
        dropzone.style.borderColor = '#00e676';
        btnScan.disabled = false;
      }
    });
  });
});
