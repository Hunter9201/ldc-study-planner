const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataPath = '/tmp/students.json';

function initData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ students: [], studentData: [] }));
  }
}

function readData() {
  initData();
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
}

function writeData(data) {
  initData();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

async function createStudent(studentData) {
  const { username, password, email, full_name } = studentData;
  const data = readData();
  
  const passwordHash = await bcrypt.hash(password, 10);
  const student = {
    id: Date.now().toString(),
    username,
    password_hash: passwordHash,
    email,
    full_name,
    created_at: new Date().toISOString()
  };
  
  data.students.push(student);
  writeData(data);
  return student;
}

function findStudentByUsername(username) {
  const data = readData();
  return data.students.find(s => s.username === username);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function getStudentData(studentId) {
  const data = readData();
  const studentData = data.studentData.find(sd => sd.studentId === studentId);
  return studentData || { progress: {}, studyPlan: [], lastUpdated: new Date().toISOString() };
}

async function saveStudentData(studentId, progress, studyPlan) {
  const data = readData();
  const existingIndex = data.studentData.findIndex(sd => sd.studentId === studentId);
  
  const studentData = { studentId, progress: progress || {}, studyPlan: studyPlan || [], lastUpdated: new Date().toISOString() };
  
  if (existingIndex >= 0) {
    data.studentData[existingIndex] = studentData;
  } else {
    data.studentData.push(studentData);
  }
  
  writeData(data);
}

module.exports = { createStudent, findStudentByUsername, verifyPassword, getStudentData, saveStudentData };
