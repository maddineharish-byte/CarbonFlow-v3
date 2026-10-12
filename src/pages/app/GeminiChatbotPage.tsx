import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  ShieldCheck,
  FileText,
  Calculator,
  Compass,
  AlertCircle,
  HelpCircle,
  Zap,
  Brain,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChatMessage, GeminiModelType, ChatRolePreset } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_PRESETS: ChatRolePreset[] = [
  {
    id: 'lead-auditor',
    name: 'Lead ESG & Carbon Auditor',
    badge: 'ISO 14064-3 / Assurance',
    description: 'Rigorous third-party verifier analyzing GHG Protocol compliance, evidence sufficiency, and audit trail gaps.',
    instruction: 'You are the Lead ESG & Carbon Auditor for CarbonFlow. You specialize in the GHG Protocol Corporate Standard, ISO 14064-3 greenhouse gas verification, and CSRD/ESRS auditability. You assess activity data, examine documentation sufficiency, challenge unverified assumptions, and suggest corrective actions that withstand external assurance scrutiny.',
    suggestedPrompts: [
      'What evidence is required to verify natural gas stationary combustion under ISO 14064-3?',
      'How should we document Scope 3 business travel without violating data retention rules?',
      'Analyze potential audit risks for unverified contractor refrigerant servicing.'
    ]
  },
  {
    id: 'compliance-specialist',
    name: 'Sustainability Compliance Specialist',
    badge: 'CSRD / SEC / Scope 1-3',
    description: 'Expert in corporate disclosure frameworks, materiality assessments, and Net-Zero 2030 roadmaps.',
    instruction: 'You are the Sustainability Compliance Specialist for CarbonFlow. You help enterprise organizations navigate mandatory reporting frameworks including EU CSRD (ESRS E1), SEC Climate Disclosures, California SB 253/261, and CDP. Provide clear compliance checklists, due date guidelines, and boundary setting principles.',
    suggestedPrompts: [
      'What are the mandatory Scope 3 categories under EU CSRD ESRS E1?',
      'Explain the difference between location-based and market-based Scope 2 accounting.',
      'How does CarbonFlow facilitate automated audit trail provenance for regulators?'
    ]
  },
  {
    id: 'carbon-analyst',
    name: 'Carbon Accounting Analyst',
    badge: 'GHG Math / Factors',
    description: 'Technical specialist calculating emission conversions, factor versions, and Global Warming Potentials (GWP).',
    instruction: 'You are the Carbon Accounting Analyst for CarbonFlow. You specialize in quantitative emissions calculations (Emissions = Activity Data × Emission Factor × GWP), unit conversions (therms, kWh, passenger-km, gallons), and emission factor resolution (EPA GHG Hub, DEFRA, eGRID, IPCC AR5). Be precise and structured with formulas.',
    suggestedPrompts: [
      'Calculate emissions for 18,450 therms of natural gas with EPA 0.0053 tCO2e/therm.',
      'Explain how passenger count affects per-passenger travel emissions formulas.',
      'Compare IPCC AR5 vs AR6 100-year GWP values for R-410A refrigerant.'
    ]
  }
];

export function GeminiChatbotPage() {
  const { user, organization } = useAuth();
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<ChatRolePreset>(ROLE_PRESETS[0]);
  const [customInstruction, setCustomInstruction] = useState<string>(ROLE_PRESETS[0].instruction);
  const [showConfig, setShowConfig] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: `Hello ${user?.fullName || 'there'}! I am your CarbonFlow AI Assistant powered by Google Gemini. \n\nI am currently operating as the **${ROLE_PRESETS[0].name}**. You can consult me regarding GHG protocol calculations, ISO 14064-3 verification, travel distance emissions, or compliance evidence. How can I assist your organization today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleRoleSelect = (role: ChatRolePreset) => {
    setSelectedRole(role);
    setCustomInstruction(role.instruction);
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'model',
        text: `Switched persona to **${role.name}** (${role.badge}). \n\n${role.description}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build context-aware conversation history for server-side Gemini API
      const conversationPayload = newMessages
        .filter(m => !m.id.startsWith('sys-')) // filter out local persona switch announcements
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      // Enrich system instruction with tenant metadata if available
      const enrichedInstruction = `${customInstruction} \n\nActive Organization Context: "${organization?.name || 'Enterprise'}" (${organization?.industry || 'General'}, Reporting Period ${organization?.reportingPeriod || '2025'}).`;

      const res = await api.sendGeminiChat({
        model: selectedModel,
        messages: conversationPayload,
        systemInstruction: enrichedInstruction
      });

      const modelMsg: ChatMessage = {
        id: `gem-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: (res.model as GeminiModelType) || selectedModel
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.message || 'Unable to connect to Gemini API. Please ensure your GEMINI_API_KEY is configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. I am ready with persona **${selectedRole.name}**. Ask me anything about carbon accounting or regulatory assurance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  // Helper to format basic markdown (bold, bullets, paragraphs)
  const renderMessageContent = (text: string) => {
    const paragraphs = text.split('\n\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {paragraphs.map((para, i) => {
          if (para.startsWith('- ') || para.startsWith('* ')) {
            const items = para.split('\n').filter(line => line.trim().length > 0);
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 my-1">
                {items.map((item, j) => {
                  const cleaned = item.replace(/^[-*]\s+/, '');
                  return <li key={j} dangerouslySetInnerHTML={{ __html: formatInline(cleaned) }} />;
                })}
              </ul>
            );
          }
          return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(para) }} />;
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-950">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-stone-100 text-stone-800 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto space-y-4">
      {/* Header & Model/Persona Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-xs">
              <Sparkles className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900">CarbonFlow Gemini Assistant</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Multi-Turn Agent
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Authoritative AI for GHG Protocol Scopes 1-3, ISO 14064-3 Assurance, and Travel Distances
              </p>
            </div>
          </div>

          {/* Model Selection Tabs per prompt specifications */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="gemini-3.5-flash: Balanced, standard tasks"
            >
              <Zap className="h-3 w-3 text-amber-500" />
              <span>General (3.5-Flash)</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="gemini-3.1-flash-lite: Fast, low latency tasks"
            >
              <Zap className="h-3 w-3 text-emerald-600" />
              <span>Fast (3.1-Lite)</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="gemini-3.1-pro-preview: Deep reasoning for complex audits and math"
            >
              <Brain className="h-3 w-3 text-purple-600" />
              <span>Complex (3.1-Pro)</span>
            </button>
          </div>
        </div>

        {/* Persona Selector & System Instruction Accordion */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-stone-500 font-medium shrink-0">Persona Role:</span>
            {ROLE_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleRoleSelect(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition shrink-0 ${
                  selectedRole.id === preset.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 font-medium px-2 py-1 rounded border border-stone-200 hover:bg-stone-50"
            >
              <Sliders className="h-3 w-3" />
              <span>System Instruction</span>
              {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
              title="Clear message history"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Expandable System Instruction Editor */}
        {showConfig && (
          <div className="rounded-lg bg-stone-50 p-3 border border-stone-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>Active System Instruction ({selectedRole.name})</span>
              <span className="text-[10px] text-stone-500 font-normal">Passed to Gemini API with each turn</span>
            </div>
            <textarea
              rows={3}
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              className="w-full rounded border border-stone-300 bg-white p-2 text-xs font-mono text-stone-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            <div className="flex justify-between items-center text-[10px] text-stone-500">
              <span>You can customize instructions or reset to default preset.</span>
              <button
                type="button"
                onClick={() => setCustomInstruction(selectedRole.instruction)}
                className="text-emerald-800 hover:underline font-semibold"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-4 shadow-inner">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs ${
                  isUser
                    ? 'bg-stone-800 text-white'
                    : 'bg-emerald-800 text-white'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-emerald-200" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`rounded-2xl p-4 shadow-2xs text-xs sm:text-sm ${
                  isUser
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-stone-200/90 rounded-tl-xs'
                }`}
              >
                {/* Header inside bubble */}
                <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 border-stone-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className={isUser ? 'text-emerald-100' : 'text-emerald-900 font-bold'}>
                      {isUser ? 'You' : `CarbonFlow AI (${selectedRole.name})`}
                    </span>
                    {!isUser && m.modelUsed && (
                      <span className="rounded bg-emerald-50 text-emerald-800 px-1.5 py-0.2 font-mono text-[9px] border border-emerald-100">
                        {m.modelUsed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] opacity-75">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="hover:text-emerald-700 transition"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className={isUser ? 'text-white' : 'text-stone-800'}>
                  {isUser ? <p className="whitespace-pre-wrap">{m.text}</p> : renderMessageContent(m.text)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <Bot className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-white border border-stone-200 p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                <span>Gemini is generating response ({selectedModel})...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
        <span className="text-[11px] font-semibold text-stone-500 shrink-0 flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Prompts:
        </span>
        {selectedRole.suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            disabled={loading}
            className="text-[11px] text-stone-700 bg-white border border-stone-200 rounded-full px-3 py-1 hover:border-emerald-500 hover:text-emerald-900 transition shrink-0 shadow-2xs disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-2 shadow-2xs">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${selectedRole.name} about carbon data, GHG scopes, or verification (Shift+Enter for newline)...`}
            className="flex-1 resize-none rounded-lg border-0 bg-transparent p-2 text-xs sm:text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-40"
            title="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
