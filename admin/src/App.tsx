import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthCheck from './auth/dashboard/AuthCheck';
import AdminDashboard from './MainDashboard/AdminDashboard'
import Login from './auth/pages/Login'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin/*" 
            element={
              <AuthCheck>
                <AdminDashboard />
              </AuthCheck>
            } 
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;