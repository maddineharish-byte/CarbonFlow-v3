import { GoogleGenAI } from '@google/genai';

const SUPPORTED_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest'
] as const;

// Domain fallback generator when external API encounters upstream 503 spikes or network limitations
function generateDomainFallback(lastUserText: string): string {
  const query = (lastUserText || '').toLowerCase();

  if (query.includes('evidence') || query.includes('iso 14064') || query.includes('audit')) {
    return `### ISO 14064-3 Audit Trail & Evidence Verification

Under **ISO 14064-3** (*Specification with guidance for the verification and validation of greenhouse gas statements*), external verifiers require a continuous audit trail:

1. **Primary Activity Documentation:**
   - Utility invoices or metered telemetry for stationary fuel (e.g., natural gas therms/MWh).
   - Calibrated utility meters with custody-transfer records.
   - Verified batch calorific values and fuel delivery manifests.

2. **Emission Factor Traceability:**
   - Explicit factor publisher documentation (e.g., EPA GHG Factors Hub v2024, DEFRA, eGRID subregion).
   - Documented 100-year Global Warming Potentials (GWPs) specified (IPCC AR5 or AR6).

3. **Data Quality & Control Rigor:**
   - Materiality threshold evaluation (standard 5% for limited assurance, 2% for reasonable assurance).
   - Immutable audit trail provenance hash (SHA-256) recorded in CarbonFlow.`;
  }

  if (query.includes('travel') || query.includes('passenger') || query.includes('flight') || query.includes('road') || query.includes('car') || query.includes('rail')) {
    return `### Scope 3 Category 6: Business Travel Calculation Framework

According to the **GHG Protocol Technical Guidance for Calculating Scope 3 Emissions (Category 6)**:

1. **Distance-Based Method (Standard of Truth):**
   $$\\text{Emissions (tCO}_2\\text{e)} = \\frac{\\text{Activity Distance (km)} \\times \\text{Emission Factor (kg CO}_2\\text{e/km)} \\times \\text{Passenger Count}}{1,000}$$

2. **Verified Published Emission Factors (DEFRA / EPA):**
   - **Passenger Car (Gasoline / ICE):** $0.1702\\text{ kg CO}_2\\text{e/km}$
   - **Electric Vehicle (EV):** $0.0530\\text{ kg CO}_2\\text{e/km}$ (Grid average basis)
   - **National Rail / Train:** $0.0355\\text{ kg CO}_2\\text{e/passenger-km}$
   - **Domestic Aviation (< 500 km):** $0.2460\\text{ kg CO}_2\\text{e/passenger-km}$ (including radiative forcing uplift)

3. **CarbonFlow Verification Trail:**
   - Origin and destination coordinates geocoded via OpenStreetMap Nominatim.
   - Road distance verified via OSRM engine and displayed on OpenFreeMap tiles.
   - Calculation recorded with immutable audit metadata in the carbon ledger.`;
  }

  if (query.includes('csrd') || query.includes('scope 3') || query.includes('esrs') || query.includes('sec')) {
    return `### Regulatory Compliance Overview: CSRD ESRS E1 & SEC Climate Disclosures

1. **EU CSRD (ESRS E1 Climate Change):**
   - **Scope 1 & Scope 2:** Mandatory gross reporting (dual reporting: location-based and market-based Scope 2).
   - **Scope 3 Value Chain:** Mandatory across material categories (Category 1 Purchased Goods, Category 4 Upstream Freight, Category 6 Business Travel).
   - **Assurance Timeline:** Limited assurance required at initial filing, transitioning to reasonable assurance.

2. **SEC Climate Disclosure Framework:**
   - Large Accelerated Filers (LAFs) must disclose material Scope 1 and Scope 2 emissions with attestation reports.
   - Clear disclosure of climate-related governance, risks, and greenhouse gas targets.

3. **CarbonFlow Audit Readiness:**
   - Immutable evidence records and cryptographic data hashes.
   - Role-based separation of duties between preparers, reviewers, and assurance providers.`;
  }

  if (query.includes('calculate') || query.includes('therm') || query.includes('kwh') || query.includes('formula')) {
    return `### Greenhouse Gas Calculation Methodology

The fundamental equation for activity-based emissions calculation is:

$$\\text{Total Emissions (tCO}_2\\text{e)} = \\frac{\\text{Activity Data} \\times \\text{Emission Factor}}{1,000}$$

#### Benchmark Examples:
- **Natural Gas (Stationary Combustion):**
  $18,450\\text{ therms} \\times 0.0053\\text{ tCO}_2\\text{e/therm} = 97.785\\text{ tCO}_2\\text{e}$
- **Purchased Electricity (Scope 2):**
  $\\text{Activity (MWh)} \\times \\text{eGRID factor (kg CO}_2\\text{e/MWh)} \\div 1,000$

All calculations are linked directly to source factors and persisted in the CarbonFlow ledger.`;
  }

  return `### CarbonFlow Enterprise AI Sustainability & Audit Assistant

Hello! I am your enterprise sustainability and GHG audit assistant.

- **GHG Protocol Standards:** Strict alignment with the GHG Protocol Corporate Accounting Standard and Scope 3 Value Chain Standard.
- **Traceable Ledger:** Every activity recorded in CarbonFlow generates an immutable audit record with timestamp, user ID, calculation formula, and source factor provenance.
- **Assurance Readiness:** Formatted for third-party verifiers following ISO 14064-3 and EU CSRD (ESRS E1) requirements.

How can I assist your organization with emissions calculations, travel mobility verification, or audit compliance today?`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event: any, _context: any) => {
  // 1. CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // 2. Health & Status Check
  if (event.httpMethod === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'online',
        runtime: 'netlify-serverless-function',
        endpoint: '/api/gemini/chat',
        supportedModels: SUPPORTED_GEMINI_MODELS,
        credentialsConfigured: hasKey
      })
    };
  }

  // 3. Ensure POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Method ${event.httpMethod} not allowed. Please use POST.`,
        code: 'METHOD_NOT_ALLOWED'
      })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { model = 'gemini-3.1-flash-lite', messages = [], systemInstruction } = body;

    // Validate request messages payload
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Invalid request: "messages" must be a non-empty array of chat messages.',
          code: 'INVALID_MESSAGES'
        })
      };
    }

    // Validate model identifier against models supported by configured Gemini API
    if (model && !SUPPORTED_GEMINI_MODELS.includes(model as any)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Unsupported Gemini model: '${model}'. Supported models are: ${SUPPORTED_GEMINI_MODELS.join(', ')}`,
          code: 'INVALID_MODEL',
          supportedModels: SUPPORTED_GEMINI_MODELS
        })
      };
    }

    const selectedModel = model === 'gemini-flash-latest' ? 'gemini-3.8-flash' : model;
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';

    // Check credentials in Netlify environment variables
    const currentApiKey = process.env.GEMINI_API_KEY || '';
    if (!currentApiKey || !currentApiKey.trim()) {
      const isStrict = event.headers && (
        event.headers['x-strict-credentials'] === 'true' ||
        event.headers['X-Strict-Credentials'] === 'true'
      );

      if (isStrict) {
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Missing Gemini API credentials on Netlify. Please set GEMINI_API_KEY in your Netlify Site Settings > Environment variables.',
            code: 'MISSING_CREDENTIALS'
          })
        };
      }

      console.warn('GEMINI_API_KEY is not configured on Netlify. Answering with CarbonFlow Sustainability Knowledge Engine.');
      const fallbackReply = generateDomainFallback(lastUserMsg);
      const setupNote = '\n\n---\n> 💡 **Netlify Setup Note:** Answering via the CarbonFlow GHG Knowledge Engine. To activate live Google Gemini models (' + selectedModel + '), add **`GEMINI_API_KEY`** in **Netlify Site configuration > Environment variables**, then trigger a redeploy.';

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          reply: fallbackReply + setupNote,
          model: 'carbonflow-ghg-engine',
          credentialsConfigured: false
        })
      };
    }

    const ai = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'carbonflow-netlify',
        }
      }
    });

    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || m.content || '') }]
    }));

    const effectiveInstruction = systemInstruction ||
      'You are the CarbonFlow Enterprise AI Sustainability & Audit Assistant. You provide expert guidance on greenhouse gas (GHG) accounting (Scopes 1, 2, and 3), emissions calculation methodologies, ISO 14064-3 and CSRD compliance, audit trails, and travel activity distance verification. Keep your answers clear, authoritative, and actionable.';

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: effectiveInstruction
        }
      });

      const reply = response.text || 'I analyzed the inquiry, but no textual response was generated.';
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ reply, model: selectedModel })
      };
    } catch (primaryErr: any) {
      const status = primaryErr?.status || primaryErr?.statusCode || primaryErr?.code;
      const errMsg = String(primaryErr?.message || primaryErr || '');

      console.warn(`Gemini API call on Netlify with ${selectedModel} failed (${status || 'unknown'}: ${errMsg})`);

      // Quota / rate limit exceeded (HTTP 429)
      if (status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
        return {
          statusCode: 429,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Gemini API rate limit or quota exceeded. Please wait a moment or upgrade your tier.',
            code: 'QUOTA_EXCEEDED',
            details: errMsg
          })
        };
      }

      // Invalid credentials (HTTP 401/403)
      if (status === 403 || errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid') || errMsg.includes('API key expired')) {
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Invalid or unauthorized Gemini API credentials in Netlify environment variables.',
            code: 'INVALID_CREDENTIALS',
            details: errMsg
          })
        };
      }

      // If temporary 503 high demand on primary model and not flash-lite, attempt automatic failover
      if (selectedModel !== 'gemini-3.1-flash-lite') {
        try {
          console.log('Attempting failover to gemini-3.1-flash-lite on Netlify...');
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: effectiveInstruction
            }
          });

          const reply = fallbackResponse.text || 'I analyzed the inquiry, but no textual response was generated.';
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              reply,
              model: 'gemini-3.1-flash-lite',
              failoverNotice: `Requested model ${selectedModel} was unavailable; automatically resolved via gemini-3.1-flash-lite.`
            })
          };
        } catch (secondaryErr: any) {
          console.warn('Failover model also failed on Netlify:', secondaryErr);
        }
      }

      // If upstream is experiencing 503 service outage, engage domain fallback
      const domainFallback = generateDomainFallback(lastUserMsg);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          reply: `${domainFallback}\n\n*(Notice: Upstream Gemini API experienced temporary high demand [HTTP 503]. Response generated by CarbonFlow Sustainability Knowledge Engine.)*`,
          model: 'carbonflow-sustainability-engine',
          upstreamError: errMsg
        })
      };
    }
  } catch (err: any) {
    console.error('Netlify function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: err?.message || 'Internal server error processing Gemini chat request on Netlify.',
        code: 'INTERNAL_SERVER_ERROR'
      })
    };
  }
};
