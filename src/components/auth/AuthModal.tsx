import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';

export type AuthModalMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

interface AuthModalProps {
  initialMode?: AuthModalMode;
  onClose: () => void;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Inicio de sesión con Google cancelado.',
  invalid_state: 'No se pudo validar la sesión de seguridad. Intenta nuevamente.',
  expired_state: 'La solicitud de inicio de sesión expiró. Intenta nuevamente.',
  unverified_google_email: 'Tu cuenta de Google no tiene un correo electrónico verificado.',
  verify_existing_account_first:
    'Existe una cuenta con ese correo pendiente de verificación. Confirma primero tu correo electrónico para asociar Google de forma segura.',
  consent_required:
    'Para crear tu cuenta nueva con Google, primero acepta la Política de Privacidad y el tratamiento de datos (Ley 1581/2012) aquí abajo y vuelve a pulsar "Continuar con Google".',
  rate_limited: 'Demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.',
  oauth_unavailable: 'El inicio de sesión con Google requiere configuración de servidor en producción.',
  oauth_failed: 'No fue posible completar la autenticación con Google.',
};

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode = 'login', onClose }) => {
  const {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    urlResetToken,
    urlVerifyToken,
    urlAuthError,
    clearUrlAuthParams,
    backendConfigured,
    isOffline,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Ley 1581/2012: NEVER pre-checked!
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (urlAuthError) {
      setErrorMsg(AUTH_ERROR_MESSAGES[urlAuthError] || 'Ocurrió un error al autenticar.');
      if (urlAuthError === 'consent_required') {
        setMode('register');
      }
    }
    if (urlResetToken) {
      setMode('reset');
    } else if (urlVerifyToken) {
      setMode('verify');
      setIsSubmitting(true);
      verifyEmail(urlVerifyToken)
        .then(res => {
          if (res.ok) {
            setSuccessMsg(res.message || 'Correo confirmado correctamente.');
            clearUrlAuthParams();
          } else {
            setErrorMsg(res.error || 'No se pudo verificar el correo.');
          }
        })
        .finally(() => setIsSubmitting(false));
    }
  }, [urlAuthError, urlResetToken, urlVerifyToken, verifyEmail, clearUrlAuthParams]);

  const switchMode = (nextMode: AuthModalMode) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMode(nextMode);
  };

  const passwordLengthOk = password.length >= 10 && password.length <= 128;
  const passwordStrengthLabel =
    password.length === 0
      ? null
      : password.length < 10
      ? { text: 'Muy corta (mínimo 10 caracteres)', color: 'text-rose-600' }
      : password.length < 14
      ? { text: 'Aceptable (NIST 800-63B)', color: 'text-amber-700' }
      : { text: 'Fuerte (frase o clave larga)', color: 'text-emerald-700' };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.ok) {
        clearUrlAuthParams();
        onClose();
      } else {
        setErrorMsg(res.error || 'Credenciales inválidas.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordLengthOk) {
      setErrorMsg('La contraseña debe tener entre 10 y 128 caracteres.');
      return;
    }
    if (!acceptedPrivacyPolicy || !acceptedDataProcessing) {
      setErrorMsg('Debes aceptar la Política de Privacidad y autorizar el tratamiento de datos personales.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        email,
        password,
        fullName,
        acceptedPrivacyPolicy,
        acceptedDataProcessing,
        acceptedMarketing,
      });
      if (res.ok) {
        setSuccessMsg(res.message || 'Revisa tu correo electrónico para confirmar tu cuenta.');
        setPassword('');
      } else {
        setErrorMsg(res.error || 'No se pudo completar el registro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email);
      if (res.ok) {
        setSuccessMsg(res.message || 'Si el correo existe, enviamos instrucciones de recuperación.');
      } else {
        setErrorMsg(res.error || 'No se pudo procesar la solicitud.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlResetToken) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!passwordLengthOk) {
      setErrorMsg('La nueva contraseña debe tener al menos 10 caracteres.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await resetPassword(urlResetToken, password);
      if (res.ok) {
        setSuccessMsg(res.message || 'Contraseña restablecida. Ya puedes iniciar sesión.');
        clearUrlAuthParams();
        setPassword('');
        setMode('login');
      } else {
        setErrorMsg(res.error || 'No se pudo restablecer la contraseña.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (isOffline) {
      setErrorMsg('Sin conexión a internet. Conéctate para iniciar sesión con Google.');
      return;
    }
    if (mode === 'register' && (!acceptedPrivacyPolicy || !acceptedDataProcessing)) {
      setErrorMsg(
        'Debes marcar las casillas obligatorias de Política de Privacidad y Ley 1581 antes de registrarte con Google.'
      );
      return;
    }
    const consentParam = mode === 'register' && acceptedPrivacyPolicy && acceptedDataProcessing ? '&consent=1' : '';
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent('/')}${consentParam}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-ranch-600 text-white flex items-center justify-center font-bold text-sm">
              AG
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && 'Crear Cuenta Ganadera'}
                {mode === 'forgot' && 'Recuperar Contraseña'}
                {mode === 'reset' && 'Nueva Contraseña'}
                {mode === 'verify' && 'Verificación de Correo'}
              </h2>
              <p className="text-[11px] text-gray-500">Acceso seguro y cifrado para tu hacienda</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearUrlAuthParams();
              onClose();
            }}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal de autenticación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isOffline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Sin conexión a internet:</strong> Puedes seguir trabajando con los datos locales de tu finca.
                Conéctate a una red para iniciar o crear tu cuenta en la nube.
              </span>
            </div>
          )}

          {!isOffline && !backendConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Entorno Local Offline:</strong> El servicio de autenticación en la nube aún no está configurado en
                este entorno. Puedes seguir operando localmente sin restricciones.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isOffline}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-200" />
                <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  o con tu correo
                </span>
                <div className="flex-grow border-t border-gray-200" />
              </div>
            </>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Correo electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ganadero@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-semibold text-ranch-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isOffline}
                className="w-full py-2.5 px-4 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Iniciar Sesión
              </button>

              <p className="text-center text-xs text-gray-600 pt-1">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-ranch-700 hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Juan Carlos Gómez"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Correo electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ganadero@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Contraseña <span className="font-normal text-gray-500">(mín. 10 caracteres o frase larga)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    maxLength={128}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ej. finca pradera ganado 2026"
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrengthLabel && (
                  <p className={`text-[11px] font-semibold mt-1 ${passwordStrengthLabel.color}`}>
                    {passwordStrengthLabel.text}
                  </p>
                )}
              </div>

              {/* Explicit Unchecked Consents (Ley 1581 de 2012) */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacyPolicy}
                    onChange={e => setAcceptedPrivacyPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-ranch-600 focus:ring-ranch-500"
                  />
                  <span className="text-[11px] text-gray-700 leading-snug">
                    He leído y acepto la{' '}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyOpen(true)}
                      className="font-bold text-ranch-700 underline"
                    >
                      Política de Privacidad
                    </button>
                    . <span className="text-rose-600">*</span>
                  </span>
                </label>

                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedDataProcessing}
                    onChange={e => setAcceptedDataProcessing(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-ranch-600 focus:ring-ranch-500"
                  />
                  <span className="text-[11px] text-gray-700 leading-snug">
                    Autorizo de forma previa, expresa e informada el tratamiento y transmisión internacional de mis datos
                    personales conforme a la Ley 1581 de 2012. <span className="text-rose-600">*</span>
                  </span>
                </label>

                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedMarketing}
                    onChange={e => setAcceptedMarketing(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-ranch-600 focus:ring-ranch-500"
                  />
                  <span className="text-[11px] text-gray-500 leading-snug">
                    (Opcional) Deseo recibir novedades técnicas y actualizaciones del producto.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isOffline}
                className="w-full py-2.5 px-4 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Cuenta
              </button>

              <p className="text-center text-xs text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-ranch-700 hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3.5 text-xs">
              <p className="text-gray-600">
                Ingresa tu correo electrónico. Si está asociado a una cuenta activa, te enviaremos un enlace de un solo
                uso válido por 30 minutos.
              </p>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ganadero@ejemplo.com"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isOffline}
                className="w-full py-2.5 px-4 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar enlace de recuperación
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Iniciar Sesión
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nueva contraseña (mín. 10 caracteres)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    maxLength={128}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full px-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-ranch-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrengthLabel && (
                  <p className={`text-[11px] font-semibold mt-1 ${passwordStrengthLabel.color}`}>
                    {passwordStrengthLabel.text}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isOffline}
                className="w-full py-2.5 px-4 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar nueva contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  clearUrlAuthParams();
                  switchMode('login');
                }}
                className="w-full py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Iniciar Sesión
              </button>
            </form>
          )}

          {/* EMAIL VERIFICATION */}
          {mode === 'verify' && (
            <div className="py-4 text-center space-y-3">
              {isSubmitting ? (
                <div className="flex flex-col items-center space-y-2 text-xs text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin text-ranch-600" />
                  <span>Verificando enlace de seguridad...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="px-4 py-2 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white text-xs font-bold"
                >
                  Ir a Iniciar Sesión
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isPrivacyOpen && <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />}
    </div>
  );
};
