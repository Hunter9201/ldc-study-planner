const { saveStudentData } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { studentId, progress, studyPlan } = req.body;
      
      if (!studentId) {
        return res.status(400).json({ success: false, error: 'Student ID is required' });
      }

      await saveStudentData(studentId, progress, studyPlan);
      res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
