import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Shield,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  KeyRound,
  Monitor,
  Loader2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';

interface ActiveSessionItem {
  idPrefix: string;
  isCurrent: boolean;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

interface AccountSecurityModalProps {
  onClose: () => void;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({ onClose }) => {
  const { user, identities, latestConsent, isOffline, apiFetch, refreshSession, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [acceptedMarketing, setAcceptedMarketing] = useState(latestConsent?.acceptedMarketing || false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPasswordIdentity = identities.some(i => i.provider === 'password');

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  useEffect(() => {
    if (typeof latestConsent?.acceptedMarketing === 'boolean') {
      setAcceptedMarketing(latestConsent.acceptedMarketing);
    }
  }, [latestConsent?.acceptedMarketing]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await apiFetch('/api/account/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        setStatusMsg({ type: 'err', text: 'No se pudieron cargar las sesiones activas.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión para consultar sesiones activas.' });
    } finally {
      setLoadingSessions(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          acceptedMarketing,
          newEmail: newEmail.trim() || undefined,
          currentPassword: newEmail.trim() && hasPasswordIdentity ? emailChangePassword : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshSession();
        setNewEmail('');
        setEmailChangePassword('');
        setStatusMsg({ type: 'ok', text: data.message || 'Perfil actualizado.' });
      } else {
        setStatusMsg({ type: 'err', text: data.error || 'No se pudo actualizar.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión a internet.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/account/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: hasPasswordIdentity ? currentPassword : undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        await loadSessions();
        setStatusMsg({ type: 'ok', text: data.message || 'Contraseña actualizada.' });
      } else {
        setStatusMsg({ type: 'err', text: data.error || 'Error al cambiar contraseña.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión a internet.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSession = async (sessionIdPrefix: string) => {
    setStatusMsg(null);
    try {
      const res = await apiFetch('/api/account/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ sessionIdPrefix }),
      });
      if (res.ok) {
        await loadSessions();
        setStatusMsg({ type: 'ok', text: 'Sesión cerrada correctamente.' });
      } else {
        setStatusMsg({ type: 'err', text: 'No se pudo cerrar la sesión seleccionada.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión a internet.' });
    }
  };

  const handleRevokeOthers = async () => {
    setStatusMsg(null);
    try {
      const res = await apiFetch('/api/account/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ revokeAllOthers: true }),
      });
      if (res.ok) {
        await loadSessions();
        setStatusMsg({ type: 'ok', text: 'Se cerraron todas las demás sesiones activas.' });
      } else {
        setStatusMsg({ type: 'err', text: 'No se pudieron cerrar las demás sesiones.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión a internet.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR MI CUENTA') return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/account/profile', { method: 'DELETE' });
      if (res.ok) {
        await logout();
        onClose();
      } else {
        setStatusMsg({ type: 'err', text: 'No se pudo completar la eliminación de cuenta.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Sin conexión a internet.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-ranch-600 text-white font-bold text-sm flex items-center justify-center">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'AG'}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Mi Cuenta y Seguridad</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors"
            aria-label="Cerrar configuración de cuenta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-gray-200 flex space-x-2 bg-white overflow-x-auto">
          {[
            { id: 'profile', label: 'Perfil y Correo', icon: User },
            { id: 'security', label: 'Seguridad y Sesiones', icon: Shield },
            { id: 'privacy', label: 'Privacidad y Eliminación', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusMsg(null);
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                  active
                    ? 'border-ranch-600 text-ranch-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {statusMsg && (
            <div
              className={`rounded-xl p-3 border flex items-center space-x-2 ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Correo actual</label>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-700">
                  <span>{user?.email}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {user?.emailVerified ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Cambiar correo electrónico <span className="font-normal text-gray-400">(requiere verificación)</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="nuevo-correo@ejemplo.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              {newEmail.trim().length > 0 && hasPasswordIdentity && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Contraseña actual para confirmar cambio de correo
                  </label>
                  <input
                    type="password"
                    required
                    value={emailChangePassword}
                    onChange={e => setEmailChangePassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acceptedMarketing}
                  onChange={e => setAcceptedMarketing(e.target.checked)}
                  className="rounded border-gray-300 text-ranch-600"
                />
                <span className="text-gray-700">Autorizo recibir comunicaciones informativas y novedades técnicas.</span>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="inline-flex items-center px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Cerrar Sesión
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isOffline}
                  className="px-4 py-2 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold disabled:opacity-50"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Métodos de inicio de sesión vinculados</h3>
                <div className="flex flex-wrap gap-2">
                  {identities.map(id => (
                    <span
                      key={id.provider}
                      className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold text-gray-800"
                    >
                      {id.provider === 'google' ? 'Google (OIDC)' : 'Correo y Contraseña'} • {id.email}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-900 flex items-center space-x-1.5">
                  <KeyRound className="w-4 h-4 text-ranch-600" />
                  <span>{hasPasswordIdentity ? 'Cambiar contraseña' : 'Establecer contraseña local'}</span>
                </h3>
                {hasPasswordIdentity && (
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                )}
                <input
                  type="password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña (mín. 10 caracteres)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || isOffline}
                  className="px-4 py-2 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold disabled:opacity-50"
                >
                  Actualizar contraseña
                </button>
              </form>

              <div className="border-t border-gray-100 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <Monitor className="w-4 h-4 text-ranch-600" />
                    <span>Sesiones activas</span>
                  </h3>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeOthers}
                      disabled={isOffline}
                      className="text-[11px] font-bold text-rose-700 hover:underline disabled:opacity-50"
                    >
                      Cerrar todas las demás sesiones
                    </button>
                  )}
                </div>

                {loadingSessions ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando sesiones...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div
                        key={s.idPrefix}
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {s.userAgent}
                            {s.isCurrent && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                                Sesión actual
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Última actividad: {new Date(s.lastSeenAt).toLocaleString()}
                          </div>
                        </div>
                        {!s.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(s.idPrefix)}
                            disabled={isOffline}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold shrink-0"
                          >
                            Cerrar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                <h3 className="font-bold text-gray-900">Privacidad y Habeas Data (Ley 1581 de 2012)</h3>
                <p className="text-gray-600">
                  Versión aceptada: <strong>{latestConsent?.policyVersion || '2026-11-v1'}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-ranch-700 font-bold underline"
                >
                  Consultar Política de Privacidad completa
                </button>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3">
                <div className="flex items-start space-x-2 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Eliminar Cuenta y Datos Personales</h4>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Esta acción revoca todas tus sesiones, elimina tus credenciales e identidades vinculadas y
                      anonimiza tus datos personales de manera irreversible.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder='Escribe "ELIMINAR MI CUENTA" para confirmar'
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'ELIMINAR MI CUENTA' || isSubmitting || isOffline}
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Eliminar Cuenta Permanentemente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPrivacyOpen && <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />}
    </div>
  );
};
