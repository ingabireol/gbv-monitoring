import React, { useState } from 'react';
import { useLoginMutation } from '../../store/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ username, password }).unwrap();
    if (result.success && result.token) {
      dispatch(setCredentials({ token: result.token, user: { username } }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit" disabled={isLoading}>Login</button>
      {error && <div>Login failed</div>}
    </form>
  );
};

export default LoginForm;
