import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './success.css';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; type?: string; resetUrl?: string } | null;
  const email = state?.email || '';
  const type = state?.type || 'forgot';
  const resetUrl = state?.resetUrl;

  const isResetSuccess = type === 'reset';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isResetSuccess ? '¡Contraseña actualizada!' : '¡Correo enviado!'}
          </h3>
          
          <p className="text-gray-600 mb-8">
            {isResetSuccess
              ? 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
              : 'Hemos enviado las instrucciones de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada.'
            }
          </p>

          {!isResetSuccess && email && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg text-left">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📧 Correo enviado a:</strong>
              </p>
              <p className="text-sm text-blue-900 font-medium mb-3">{email}</p>
              {resetUrl && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-900 mb-2 font-semibold">🔧 Enlace de desarrollo:</p>
                  <a 
                    href={resetUrl} 
                    className="text-xs text-blue-600 hover:text-blue-700 break-all underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resetUrl}
                  </a>
                  <p className="text-xs text-yellow-800 mt-2">Copia y pega este enlace en tu navegador</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Volver al inicio de sesión
          </button>

          {!isResetSuccess && (
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ¿No recibiste el correo? Reenviar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;

