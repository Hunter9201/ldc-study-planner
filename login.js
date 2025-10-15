const { findStudentByUsername, verifyPassword, getStudentData } = require('./db');

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
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const student = await findStudentByUsername(username);
      if (!student) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(password, student.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const studentData = await getStudentData(student.id);
      
      res.json({
        success: true,
        message: 'Login successful',
        student: { id: student.id, username: student.username, email: student.email, full_name: student.full_name },
        progress: studentData.progress,
        studyPlan: studentData.studyPlan
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
