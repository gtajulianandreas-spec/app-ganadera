import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  MessageSquare, 
  Copy, 
  Check, 
  Smartphone, 
  QrCode, 
  Star, 
  Send, 
  HeartHandshake, 
  ExternalLink,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import type { Animal, Farm } from '../../types/animal';

interface ShareAndFeedbackModalProps {
  farms: Farm[];
  animals: Animal[];
  currentFarmId: string;
  onClose: () => void;
}

export const ShareAndFeedbackModal: React.FC<ShareAndFeedbackModalProps> = ({
  farms,
  animals,
  currentFarmId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'feedback'>('share');
  const [copied, setCopied] = useState(false);

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [testedModule, setTestedModule] = useState('inventory');
  const [easeOfUse, setEaseOfUse] = useState('Muy fácil e intuitiva');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [suggestedFeature, setSuggestedFeature] = useState('');
  const [testerName, setTesterName] = useState('');
  const [testerPhone, setTesterPhone] = useState('');

  // Current URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://app-ganadera.vercel.app';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`;

  // Device diagnostics
  const diagnostics = useMemo(() => {
    const ua = navigator.userAgent;
    let os = 'Desconocido';
    if (/android/i.test(ua)) os = 'Android';
    else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS (iPhone/iPad)';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const farm = farms.find(f => f.id === currentFarmId);

    return {
      os,
      screenRes,
      animalCount: animals.length,
      farmName: farm?.name || 'Visión Global',
      date: new Date().toLocaleString('es-CO')
    };
  }, [farms, animals, currentFarmId]);

  const invitationMessage = `🐮 *¡Hola colega ganadero!* Te invito a probar la versión piloto de *APP GANADERA*.
📲 Funciona directamente desde el navegador de tu celular y puedes usarla en el potrero sin internet:
🔗 ${currentUrl}
_Al abrirla, puedes instalarla en tu pantalla de inicio en 1 toque._`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsAppFeedback = () => {
    const feedbackText = `📋 *FEEDBACK DE EVALUADOR - APP GANADERA*
👤 *Evaluador:* ${testerName.trim() || 'Ganadero Anónimo'} ${testerPhone ? `(${testerPhone})` : ''}
⭐ *Calificación:* ${rating} / 5 estrellas
🎯 *Módulo Probado:* ${testedModule}
👌 *Facilidad de uso:* ${easeOfUse}

💬 *Comentario / Observación:*
${feedbackComment.trim() || 'Sin comentarios adicionales.'}

💡 *Función que le gustaría agregar:*
${suggestedFeature.trim() || 'Ninguna por ahora.'}

📱 *Diagnóstico Técnico:*
• SO: ${diagnostics.os}
• Pantalla: ${diagnostics.screenRes}
• Finca: ${diagnostics.farmName}
• Animales cargados: ${diagnostics.animalCount}
• Fecha: ${diagnostics.date}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(feedbackText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-ranch-900 via-ranch-800 to-emerald-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Compartir App & Canal de Feedback</h2>
              <p className="text-xs text-emerald-200">
                Pruebas externas con ganaderos y recolección de observaciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs: Compartir vs Feedback */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-2">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'share'
                ? 'border-ranch-600 text-ranch-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-ranch-600" />
            <span>Invitar a Otros Ganaderos</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'feedback'
                ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Enviar Feedback por WhatsApp</span>
          </button>
        </div>

        {/* Tab 1: Share Content */}
        {activeTab === 'share' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-gray-700">
            
            {/* Quick Sandbox Note */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold">Privacidad Total Garantizada:</span> Cada ganadero que abra el enlace
                trabaja en su propia base de datos aislada en su celular (IndexedDB). No se mezclan animales ni datos financieros de diferentes usuarios.
              </div>
            </div>

            {/* QR Code & Link Card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-36 h-36 bg-white p-2 rounded-xl border border-gray-200 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={qrApiUrl}
                  alt="Código QR de la App"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-gray-900 text-sm">Escanea para Probar en tu Teléfono</h4>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Apunta con la cámara de tu celular a este código QR para abrir APP GANADERA al instante sin descargar nada.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold shadow-2xs transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
                        ¡Mensaje Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copiar Invitación para WhatsApp
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(invitationMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Enviar por WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Step-by-Step Installation Guide for Farmers */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center">
                <Smartphone className="w-4 h-4 mr-1.5 text-ranch-600" />
                Cómo Instalarla en 1 Toque en el Celular (PWA)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                {/* Android */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>En Android (Google Chrome):</span>
                  </div>
                  <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                    <li>Abre el enlace en Chrome.</li>
                    <li>Toca los tres puntos (⋮) arriba a la derecha.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".</li>
                  </ol>
                </div>

                {/* iPhone / iOS */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>En iPhone (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                    <li>Abre el enlace en Safari.</li>
                    <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha ↑).</li>
                    <li>Desliza y selecciona <strong>"Agregar al inicio"</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Feedback Content */}
        {activeTab === 'feedback' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-gray-700">
            
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                ¿Qué tal tu experiencia general probando la app?
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-700 ml-2">
                  {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy buena' : rating === 3 ? 'Aceptable' : 'Por mejorar'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tu Nombre o Finca</label>
                <input
                  type="text"
                  value={testerName}
                  onChange={e => setTesterName(e.target.value)}
                  placeholder="Ej: Don Carlos - Hacienda Belén"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Módulo que más probaste</label>
                <select
                  value={testedModule}
                  onChange={e => setTestedModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold"
                >
                  <option value="Inventario y Fichas de Ganado">Inventario y Fichas de Ganado</option>
                  <option value="Búsqueda Visual por Foto">Búsqueda Visual por Foto</option>
                  <option value="Control de Ordeño y Leche">Control de Ordeño y Leche</option>
                  <option value="Pesaje y Ceba en Báscula">Pesaje y Ceba en Báscula</option>
                  <option value="Control Reproductivo y Secado">Control Reproductivo y Secado</option>
                  <option value="Sanidad, Dosis y Períodos de Retiro">Sanidad, Dosis y Retiro</option>
                  <option value="Asistente con Inteligencia Artificial">Asistente con IA</option>
                  <option value="Finanzas y Rentabilidad">Finanzas y Rentabilidad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                ¿Qué te pareció o qué observaciones tienes sobre el funcionamiento?
              </label>
              <textarea
                rows={3}
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Ej: Me gustó mucho el cálculo de días de secado. Me gustaría que al registrar ordeño recuerde el ordeño del día anterior..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                ¿Qué función indispensable le hace falta para usarla en tu día a día?
              </label>
              <input
                type="text"
                value={suggestedFeature}
                onChange={e => setSuggestedFeature(e.target.value)}
                placeholder="Ej: Alerta por SMS al mayordomo, integración con báscula Gallagher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            {/* Diagnostic Snapshot */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px] text-gray-500 space-y-0.5">
              <span className="font-bold text-gray-700 block">Diagnóstico técnico incluido automáticamente:</span>
              <div>Dispositivo: {diagnostics.os} • Pantalla: {diagnostics.screenRes} • Animales: {diagnostics.animalCount}</div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-5 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Cerrar
          </button>

          {activeTab === 'feedback' && (
            <button
              onClick={handleSendWhatsAppFeedback}
              className="inline-flex items-center px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Enviar a WhatsApp
            </button>
          )}

          {activeTab === 'share' && (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {copied ? '¡Copiado!' : 'Copiar Enlace'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
