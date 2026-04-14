// Extracts Job Description text from common job boards

function extractJobDescription() {
  let jdText = "";
  
  // LinkedIn
  const linkedinDescription = document.querySelector('#job-details') || document.querySelector('.jobs-description');
  if (linkedinDescription) {
    jdText = linkedinDescription.innerText;
  }
  
  // Indeed
  if (!jdText) {
    const indeedDescription = document.querySelector('#jobDescriptionText');
    if (indeedDescription) jdText = indeedDescription.innerText;
  }
  
  // Glassdoor
  if (!jdText) {
    const glassdoorDescription = document.querySelector('.jobDescriptionContent');
    if (glassdoorDescription) jdText = glassdoorDescription.innerText;
  }
  
  // Fallback: Just grab all paragraph text on page if specific selectors fail,
  // but limit to main tag or body.
  if (!jdText) {
    const main = document.querySelector('main') || document.body;
    jdText = Array.from(main.querySelectorAll('p, li'))
                  .map(el => el.innerText)
                  .join(' ');
  }

  return jdText.trim();
}

extractJobDescription();
