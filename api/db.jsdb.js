// Simple file-based database for Vercel serverless functions
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Use /tmp directory which is writable in Vercel
const DATA_FILE = '/tmp/ldc_students_data.json';

// Initialize data file
function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      students: [],
      studentData: [],
      lastCleanup: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Initialized new data file');
  }
}

// Read data from file
function readData() {
  try {
    initDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    // Return empty data structure if file is corrupted
    return { students: [], studentData: [], lastCleanup: new Date().toISOString() };
  }
}

// Write data to file
function writeData(data) {
  try {
    initDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

// Clean up old data (optional maintenance)
function cleanupOldData() {
  const data = readData();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Only cleanup once per day
  const lastCleanup = new Date(data.lastCleanup);
  if (now.getTime() - lastCleanup.getTime() < 24 * 60 * 60 * 1000) {
    return;
  }
  
  // Remove students older than 30 days with no activity
  data.students = data.students.filter(student => {
    const studentData = data.studentData.find(sd => sd.studentId === student.id);
    if (!studentData) return false;
    
    const lastUpdated = new Date(studentData.lastUpdated);
    return now.getTime() - lastUpdated.getTime() < 30 * 24 * 60 * 60 * 1000;
  });
  
  // Remove orphaned student data
  data.studentData = data.studentData.filter(studentData => 
    data.students.some(student => student.id === studentData.studentId)
  );
  
  data.lastCleanup = now.toISOString();
  writeData(data);
}

// Student management functions
async function createStudent(studentData) {
  const { username, password, email, full_name } = studentData;
  const data = readData();
  
  // Check if user already exists
  if (data.students.find(s => s.username === username)) {
    throw new Error('User already exists');
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const student = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    username,
    password_hash: passwordHash,
    email,
    full_name,
    created_at: new Date().toISOString()
  };
  
  data.students.push(student);
  
  // Create initial student data record
  const studentDataRecord = {
    studentId: student.id,
    progress: {},
    studyPlan: [],
    lastUpdated: new Date().toISOString()
  };
  
  data.studentData.push(studentDataRecord);
  
  if (writeData(data)) {
    // Run cleanup in background (non-blocking)
    setTimeout(cleanupOldData, 100);
    return student;
  } else {
    throw new Error('Failed to save student data');
  }
}

function findStudentByUsername(username) {
  const data = readData();
  return data.students.find(s => s.username === username);
}

function findStudentById(studentId) {
  const data = readData();
  return data.students.find(s => s.id === studentId);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function getStudentData(studentId) {
  const data = readData();
  const studentData = data.studentData.find(sd => sd.studentId === studentId);
  
  if (studentData) {
    return {
      progress: studentData.progress || {},
      studyPlan: studentData.studyPlan || [],
      lastUpdated: studentData.lastUpdated
    };
  }
  
  // Return default data if not found
  return {
    progress: {},
    studyPlan: [],
    lastUpdated: new Date().toISOString()
  };
}

async function saveStudentData(studentId, progress, studyPlan) {
  const data = readData();
  
  // Verify student exists
  if (!data.students.find(s => s.id === studentId)) {
    throw new Error('Student not found');
  }
  
  const existingIndex = data.studentData.findIndex(sd => sd.studentId === studentId);
  
  const studentData = {
    studentId,
    progress: progress || {},
    studyPlan: studyPlan || [],
    lastUpdated: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    data.studentData[existingIndex] = studentData;
  } else {
    data.studentData.push(studentData);
  }
  
  if (writeData(data)) {
    return true;
  } else {
    throw new Error('Failed to save student data');
  }
}

// Get system stats (for debugging)
function getSystemStats() {
  const data = readData();
  return {
    totalStudents: data.students.length,
    totalStudentData: data.studentData.length,
    lastCleanup: data.lastCleanup
  };
}

module.exports = {
  createStudent,
  findStudentByUsername,
  findStudentById,
  verifyPassword,
  getStudentData,
  saveStudentData,
  getSystemStats
};
