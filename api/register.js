const { createStudent, findStudentByUsername } = require('./db');

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
    
    const { username, password, email, full_name } = body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingStudent = await findStudentByUsername(username);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'A user with this username already exists'
      });
    }
    
    // Create new student
    const student = await createStudent({
      username,
      password,
      email,
      full_name
    });
    
    // Return success response (without password hash)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      student: {
        id: student.id,
        username: student.username,
        email: student.email,
        full_name: student.full_name,
        created_at: student.created_at
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
};
