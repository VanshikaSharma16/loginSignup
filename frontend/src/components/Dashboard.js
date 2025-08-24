import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // First try to use stored user data
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      try {
        // Verify token and get fresh user data
        const res = await axios.get('http://localhost:5001/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(res.data.user);
        setLoading(false);
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (err.response?.status === 401) {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError('Failed to fetch user data');
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="alert alert-error">{error}</div>
        <button onClick={() => navigate('/login')} className="btn">
          Go to Login
        </button>
      </div>
    );
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
    </div>
  );
};

export default Dashboard;