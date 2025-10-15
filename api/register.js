const { createStudent, findStudentByUsername } = require('./db');

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
      const { username, password, email, full_name } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const existing = await findStudentByUsername(username);
      if (existing) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }

      const student = await createStudent({ username, password, email, full_name });
      
      res.json({ 
        success: true, 
        message: 'Registration successful', 
        student: { id: student.id, username, email, full_name }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
