(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: "John Doe\nSoftware Engineer with 5 years experience in Node.js and AWS. Built APIs, led migrations." }),
      // no timeout here; Node default
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  } catch (err) {
    console.error('FETCH ERROR', err.message);
  }
})();
