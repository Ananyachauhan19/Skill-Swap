import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';

export default function AuthSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
          credentials: 'include'
        });
        if (res.ok) {
          await res.json(); // optionally push into context
          navigate('/home', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  return <div style={{padding:24}}>Completing authentication…</div>;
}