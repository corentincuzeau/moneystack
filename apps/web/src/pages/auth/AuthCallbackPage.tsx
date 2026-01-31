import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../services/api';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const expiresIn = searchParams.get('expiresIn');

      if (accessToken && refreshToken && expiresIn) {
        const tokens = {
          accessToken,
          refreshToken,
          expiresIn: parseInt(expiresIn, 10),
        };

        // Fetch user data
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const user = response.data.data;
          login(user, tokens);
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-medium text-gray-900">Connexion en cours...</h2>
      <p className="text-gray-600 mt-2">Veuillez patienter</p>
    </div>
  );
}
