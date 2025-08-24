import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Verify token and get user data
    const fetchUserData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    fetchUserData();
  }, [navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Welcome to Dashboard</h1>
      <div className="user-info">
        <h2>User Information</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
    </div>
  );
};

export default Dashboard; // यह line जोड़ें