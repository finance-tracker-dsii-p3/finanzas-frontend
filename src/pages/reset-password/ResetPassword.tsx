import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import './reset-password.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; full_name: string } | null>(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token no válido o faltante');
        setIsValidating(false);
        return;
      }

      try {
        const response = await authService.validateResetToken(token);
        if (response.valid && response.user) {
          setIsTokenValid(true);
          setUserInfo(response.user);
        } else {
          setError('Token inválido o expirado');
        }
      } catch {
        setError('Error al validar el token. Por favor solicita un nuevo enlace.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const hasMinLength = password.length >= 8;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      hasMinLength,
      isValid: hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError('La contraseña debe contener al menos una mayúscula, una minúscula, un número, un carácter especial y tener mínimo 8 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!token) {
      setError('Token no válido');
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordReset({
        token,
        new_password: formData.password,
        new_password_confirm: formData.confirmPassword
      });

      navigate('/success', { state: { type: 'reset' } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer contraseña. Por favor intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-gray-600">Validando token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Token inválido</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Solicitar nuevo enlace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Crear nueva contraseña</h3>
            {userInfo && (
              <p className="text-gray-600 mb-2">
                Para: <strong>{userInfo.full_name || userInfo.username}</strong>
              </p>
            )}
            <p className="text-gray-600">
              Tu nueva contraseña debe ser diferente a las anteriores
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirma tu contraseña"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {formData.password && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Tu contraseña debe contener:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={passwordValidation.hasMinLength ? 'text-gray-900' : 'text-gray-600'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={passwordValidation.hasUpperCase ? 'text-gray-900' : 'text-gray-600'}>
                      Una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={passwordValidation.hasLowerCase ? 'text-gray-900' : 'text-gray-600'}>
                      Una letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={passwordValidation.hasNumber ? 'text-gray-900' : 'text-gray-600'}>
                      Un número
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={passwordValidation.hasSpecialChar ? 'text-gray-900' : 'text-gray-600'}>
                      Un carácter especial
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

