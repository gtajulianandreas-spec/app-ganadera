import React from 'react';
import { X, ShieldCheck, Scale, Globe, Lock } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-ranch-100 text-ranch-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Política de Privacidad y Tratamiento de Datos Personales
              </h2>
              <p className="text-[11px] text-gray-500">
                Versión 2026-11-v1 • Marco: Ley 1581 de 2012 y Decreto 1074 de 2015 (Colombia)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors"
            aria-label="Cerrar política de privacidad"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900">
            <strong className="font-bold">Aviso Legal Importante:</strong> Este documento técnico proporciona los
            mecanismos informativos exigidos por la normativa de protección de datos. Antes del lanzamiento comercial
            público, el responsable del tratamiento debe completar su razón social/NIT, domicilio, correo oficial de
            consultas/reclamos y someter este texto a revisión de asesoría jurídica especializada.
          </div>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-ranch-600" />
              <span>1. Responsable y Marco Normativo</span>
            </h3>
            <p>
              El tratamiento de los datos personales recolectados a través de <strong>HATERRA</strong> se rige por
              la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto Único Reglamentario 1074 de 2015</strong>{' '}
              y los lineamientos de la Superintendencia de Industria y Comercio (SIC) de la República de Colombia, así
              como por principios equivalentes del Reglamento General de Protección de Datos (RGPD) cuando aplique.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">2. Datos Recolectados y Principio de Minimización</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Identidad y Acceso:</strong> Nombre completo, dirección de correo electrónico verificada y
                identificador de proveedor externo (cuando eliges iniciar sesión con Google).
              </li>
              <li>
                <strong>Seguridad Operacional:</strong> Registros de sesiones activas, agente de usuario y hash
                criptográfico irreversible de dirección IP para prevenir accesos no autorizados y fuerza bruta.
              </li>
              <li>
                <strong>Evidencia de Consentimiento:</strong> Fecha, hora y versión de la política aceptada expresamente.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">3. Finalidades del Tratamiento</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear, autenticar y administrar tu cuenta de usuario y tus sesiones activas.</li>
              <li>Proteger la integridad de tu información pecuaria mediante controles de acceso y auditoría.</li>
              <li>Enviar comunicaciones estrictamente transaccionales (verificación de correo y restablecimiento de clave).</li>
              <li>
                <em>Opcional (requiere autorización separada):</em> Envío de novedades del producto o recomendaciones
                técnicas, revocable en cualquier momento desde Mi Cuenta.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-ranch-600" />
              <span>4. Transmisión y Transferencia Internacional de Datos</span>
            </h3>
            <p>
              Para prestar el servicio en la nube, la aplicación utiliza infraestructura tecnológica de terceros ubicada
              fuera de Colombia (alojamiento en <strong>Vercel</strong>, base de datos administrada en{' '}
              <strong>PostgreSQL</strong>, correo transaccional en <strong>Resend</strong> y autenticación opcional con{' '}
              <strong>Google OAuth 2.0</strong>). Al otorgar tu autorización expresa, consientes la transmisión
              internacional necesaria bajo estándares cifrados TLS y acuerdos de confidencialidad.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-ranch-600" />
              <span>5. Derechos de los Titulares (Habeas Data) y Eliminación</span>
            </h3>
            <p>
              Como titular tienes derecho a conocer, actualizar, rectificar, solicitar prueba de la autorización,
              revocar el consentimiento y solicitar la supresión de tus datos personales desde la sección{' '}
              <strong>Mi Cuenta → Privacidad y Eliminación</strong>. Los registros de auditoría de seguridad pueden
              conservarse de forma anonimizada durante los plazos legales exigidos para defensa ante fraudes o
              requerimientos de autoridad competente.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
