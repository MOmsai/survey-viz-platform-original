const express = require('express');
const router = express.Router();
const _ = require('lodash');
const jstat = require('jstat');

router.post('/chisquare', (req, res) => {
  const { observed } = req.body;
  try {
    const chiSquare = jstat.chisquare.test(observed);
    res.json({ pValue: chiSquare.p, statistic: chiSquare.chisquare });
  } catch (err) {
    res.status(500).send('Chi-square test failed');
  }
});

module.exports = router;