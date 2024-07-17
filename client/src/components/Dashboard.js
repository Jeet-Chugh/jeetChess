import React, { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h1>Dashboard</h1>
      {(user !== null) ? (
        <div>
          <p>Welcome, {user.username}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Please log in.</p>
      )}
    </div>
  );
};

export default Dashboard;