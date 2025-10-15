const { findStudentByUsername, verifyPassword, getStudentData } = require('./db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.'
    });
  }
  
  try {
    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body'
      });
    }
    
    const { username, password } = body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Find student
    const student = await findStudentByUsername(username);
    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, student.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Get student data
    const studentData = await getStudentData(student.id);
    
    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      student: {
        id: student.id,
        username: student.username,
        email: student.email,
        full_name: student.full_name,
        created_at: student.created_at
      },
      progress: studentData.progress,
      studyPlan: studentData.studyPlan,
      lastUpdated: studentData.lastUpdated
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
};
