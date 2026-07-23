import React, { useState } from 'react';
import axios from 'axios';
import styles from './LoginPage.module.css';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; 
import LoadingSpinner from './LoadingSpinner';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username: username,
        password: password
      });

      localStorage.setItem('access_token',response.data.access);
      localStorage.setItem('refresh_token',response.data.refresh);
      onLoginSuccess(response.data.access);
    } catch (err) {
      console.error("خطا در لاگین ",err);
      toast.error('نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className={styles.errorAlert}>{error}</div>}
        
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Username" 
          required 
        />
        
        <div className={styles.passwordWrapper}>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            required
          />
          <span 
            className={styles.eyeIcon}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </span>
        </div>

        <button type="submit" disabled={loading} class name={loading?styles.loadingButton:''}>
          {loading ? <LoadingSpinner/> : 'ورود'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;