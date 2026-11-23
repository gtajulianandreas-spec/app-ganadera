import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  Milk,
  ArrowRight,
  Globe,
  Building2,
  Zap,
  BookOpen
} from 'lucide-react';
import type { AiMessage, AiMode } from '../../types/ai';
import { AiAssistantService } from '../../services/aiAssistant';

interface CattleAiChatModalProps {
  farmId?: string;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const CattleAiChatModal: React.FC<CattleAiChatModalProps> = ({
  farmId = 'all',
  onClose,
  onNavigateToTab
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message from AI
  useEffect(() => {
    async function loadWelcome() {
      setIsTyping(true);
      const initial = await AiAssistantService.queryAssistant('hola', 'auto', farmId);
      setMessages([initial]);
      setIsTyping(false);
    }
    loadWelcome();
  }, [farmId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isTyping) return;

    const userMsg: AiMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const response = await AiAssistantService.queryAssistant(text, aiMode, farmId);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'Disculpa, ocurrió un error procesando tu consulta.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const localQuickQuestions = [
    '¿Qué vacas debo secar esta semana?',
    '¿Cuál es el costo real por litro de leche?',
    '¿Cómo va la ganancia de peso en ceba?',
    '¿Cuántos partos hay en los próximos 30 días?'
  ];

  const externalQuickQuestions = [
    'Protocolo IATF con DIB y cipionato',
    'Dosis de Oxitetraciclina L.A. y retiro',
    'Manejo agronómico de pasto Brachiaria',
    'Calostrado neonatal y diarrea en terneros',
    'Cruzamiento Girolando vs F1 Angus'
  ];

  const currentSuggestions = 
    aiMode === 'farm_local' 
      ? localQuickQuestions 
      : aiMode === 'external_consultant' 
      ? externalQuickQuestions 
      : [...localQuickQuestions.slice(0, 2), ...externalQuickQuestions.slice(0, 2)];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-ranch-700 via-ranch-800 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold tracking-tight">Asistente IA Ganadero</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  Local + Consultor Global
                </span>
              </div>
              <p className="text-xs text-ranch-200">
                Consulta tu hato local o haz preguntas abiertas sobre zootecnia, fármacos y pasturas
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">
            Modo de Consulta:
          </span>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setAiMode('auto')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                aiMode === 'auto'
                  ? 'bg-ranch-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Automático</span>
            </button>

            <button
              onClick={() => setAiMode('farm_local')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                aiMode === 'farm_local'
                  ? 'bg-ranch-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Mi Finca (Local)</span>
            </button>

            <button
              onClick={() => setAiMode('external_consultant')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                aiMode === 'external_consultant'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Consultor Global (Externo)</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-gray-50/50">
          {messages.map(msg => (
            <div 
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user' 
                  ? 'bg-gray-800 text-white' 
                  : msg.mode === 'external_consultant'
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xs'
                  : 'bg-gradient-to-br from-ranch-600 to-emerald-600 text-white shadow-xs'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-ranch-600 text-white font-medium shadow-xs'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-xs'
              }`}>
                {msg.sender === 'assistant' && msg.mode && (
                  <div className="flex items-center space-x-1.5 pb-2 border-b border-gray-100">
                    {msg.mode === 'external_consultant' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <Globe className="w-3 h-3 mr-1" /> Conocimiento Externo / Zootecnia Global
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Building2 className="w-3 h-3 mr-1" /> Base de Datos de Mi Hato (Local)
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>

                {/* Structured Interactive Data Card */}
                {msg.dataCard && (
                  <div className={`p-3.5 rounded-xl border space-y-2 mt-2 ${
                    msg.dataCard.type === 'external_reference'
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-[11px] uppercase tracking-wider ${
                        msg.dataCard.type === 'external_reference' ? 'text-blue-900' : 'text-emerald-900'
                      }`}>
                        {msg.dataCard.title}
                      </span>
                      {msg.dataCard.type === 'external_reference' ? (
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/50">
                      {msg.dataCard.metrics.map((m, idx) => (
                        <div key={idx} className="bg-white/80 p-2 rounded-lg text-center shadow-2xs">
                          <span className="text-gray-500 block text-[9px] font-medium uppercase truncate">
                            {m.label}
                          </span>
                          <span className="font-extrabold text-gray-900 text-xs mt-0.5 block truncate">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {msg.dataCard.actionLabel && (
                      <button
                        onClick={() => {
                          onClose();
                          if (onNavigateToTab) {
                            if (msg.dataCard?.type === 'reproduction_alert') onNavigateToTab('reproduction');
                            else if (msg.dataCard?.type === 'financial_summary') onNavigateToTab('finance');
                            else if (msg.dataCard?.type === 'weight_gain_analysis') onNavigateToTab('weights');
                          }
                        }}
                        className={`w-full py-1.5 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors ${
                          msg.dataCard.type === 'external_reference'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <span>{msg.dataCard.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-400 text-xs italic">
              <Bot className="w-4 h-4 animate-spin text-ranch-600" />
              <span>El Asistente está procesando la consulta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="font-bold text-gray-400 shrink-0 text-[10px] uppercase">Sugerencias:</span>
          {currentSuggestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-ranch-50 text-gray-700 hover:text-ranch-800 border border-gray-200 shrink-0 transition-colors font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center space-x-3">
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={
              aiMode === 'external_consultant'
                ? "Pregunta sobre fármacos, protocolos IATF, pasturas o nutrición..."
                : aiMode === 'farm_local'
                ? "Pregunta sobre tus vacas, partos, secados o finanzas de la finca..."
                : "Haz cualquier pregunta sobre tu finca o zootecnia general..."
            }
            className="flex-1 px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isTyping}
            className="p-2.5 bg-ranch-600 hover:bg-ranch-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
