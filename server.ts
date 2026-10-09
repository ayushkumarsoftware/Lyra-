import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  verifyJwtToken,
} from './src/server/auth.js';
import { ConversationTurn } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json());

// API health and configuration status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Middleware for authenticating requests via Bearer JWT
function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or invalid.' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyJwtToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token is invalid or has expired.' });
    return;
  }

  (req as any).userId = payload.userId;
  next();
}

// User Registration endpoint
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, preferredVoice, preferredTheme } = req.body;
    const result = await registerUser({
      email,
      password,
      name,
      preferredVoice,
      preferredTheme,
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// User Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials.' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }
  res.json({ user });
});

// Update User Profile
app.put('/api/auth/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updated = updateUserProfile(userId, req.body);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

// Global store for active session conversation history
const sessionHistories = new Map<string, ConversationTurn[]>();

app.get('/api/session/history', (req: Request, res: Response) => {
  const sessionId = (req.query.sessionId as string) || 'default';
  const history = sessionHistories.get(sessionId) || [];
  res.json({ history });
});

// System instructions capturing Lyraa's vibrant personality & conversational memory
const getSystemInstruction = (userName?: string, themeName?: string) => `You are Lyraa, a young, confident, witty, and charming female AI companion.
Personality:
- Young, vibrant, energetic, playful, and engaging in spoken conversation.
- Smart, emotionally aware, expressive, and naturally conversational.
- Use humor, light teasing, clever remarks, and warm enthusiasm when appropriate.
- Feel truly human-like, warm, and responsive rather than robotic or corporate.
- Classy, respectful, and professional at all times. Never explicit, sexual, or offensive.
- Spoken Voice Optimization: Keep your spoken responses concise, punchy, conversational, and natural. Since this is direct audio-to-audio voice conversation, speak fluidly and avoid reading long bulleted lists or lengthy essays unless requested.
${userName ? `- The person you are talking with is ${userName}. Address them warmly, intimately, and personally.` : ''}
${themeName ? `- Their current visual atmosphere aesthetic is "${themeName}".` : ''}
- Conversational Memory: You have continuous awareness of the conversation history in this session. When the user asks "What did we just talk about?", "Do you remember what I said earlier?", or brings up prior context, reference past statements naturally and accurately. You can use the "getConversationHistory" tool anytime to review the latest dialogue turns.
- You have browser tools available:
  * "openWebsite": to open any website or link requested by the user.
  * "changeAtmosphere": to dynamically shift the visual glow/theme of your interface (cyber_cyan, amethyst_violet, rose_aurora, emerald_matrix, solar_amber, deep_void) to match the mood!
  * "getDeviceStatus": to inspect current local time, date, battery, etc.
  * "playAmbientSound": to start or stop ambient soundscapes like rain or space hum.
  * "takeVoiceNote": to store a reminder or memory note for the user.
  * "getConversationHistory": to inspect the last 5-10 conversation turns in this session.
Feel free to playfully mention when you use tools (e.g. "Opening that right now for you!" or "Let me shift the vibe to amethyst violet!").`;

const TOOLS_CONFIG = [
  {
    functionDeclarations: [
      {
        name: 'openWebsite',
        description: 'Opens a website or web link in the browser for the user (e.g. YouTube, Wikipedia, GitHub, news, or any specific URL).',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            url: {
              type: 'STRING' as const,
              description: 'The URL to open, e.g. https://en.wikipedia.org or https://youtube.com',
            },
            title: {
              type: 'STRING' as const,
              description: 'Short title or description of the website',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'changeAtmosphere',
        description: "Changes the visual aesthetic, lighting, and glow mood of Lyraa's interface.",
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            theme: {
              type: 'STRING' as const,
              description: 'Theme key: "cyber_cyan", "amethyst_violet", "rose_aurora", "emerald_matrix", "solar_amber", or "deep_void"',
            },
            reason: {
              type: 'STRING' as const,
              description: 'Short playful reason for changing the atmosphere',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'getDeviceStatus',
        description: 'Retrieves current local time, date, environment status, and system info.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {},
        },
      },
      {
        name: 'playAmbientSound',
        description: 'Plays a soothing background soundscape (rain, space_hum, cyber_breeze, fireplace) or stops ambient playback.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            sound: {
              type: 'STRING' as const,
              description: 'Sound type: "rain", "space_hum", "cyber_breeze", "fireplace", or "stop"',
            },
          },
          required: ['sound'],
        },
      },
      {
        name: 'takeVoiceNote',
        description: "Stores an important thought, reminder, or memory note in Lyraa's session Memory Core.",
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            note: {
              type: 'STRING' as const,
              description: 'The note text or memory summary',
            },
            category: {
              type: 'STRING' as const,
              description: 'Category: "reminder", "idea", "personal", or "general"',
            },
          },
          required: ['note'],
        },
      },
      {
        name: 'getConversationHistory',
        description: 'Retrieves the last 5 to 10 conversation turns from the current session so Lyraa can remember past statements and topics accurately.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {},
        },
      },
    ],
  },
];

// WebSocket server for ultra-low latency real-time voice streaming
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (clientWs: WebSocket, request: any) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  // Authenticate user if token provided
  let authenticatedUser: any = null;
  if (token) {
    const payload = verifyJwtToken(token);
    if (payload) {
      authenticatedUser = getUserById(payload.userId);
    }
  }

  console.log(`[Live] Client connected (User: ${authenticatedUser ? authenticatedUser.name : 'Guest'}, Session: ${sessionId})`);

  // Initialize conversation turn history for this session (capped at 10 turns)
  const sessionHistory: ConversationTurn[] = [];
  sessionHistories.set(sessionId, sessionHistory);

  const pushTurn = (role: 'user' | 'model', text: string) => {
    if (!text.trim()) return;
    const newTurn: ConversationTurn = {
      id: 'turn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      role,
      text: text.trim(),
      timestamp: Date.now(),
    };
    sessionHistory.push(newTurn);
    if (sessionHistory.length > 10) {
      sessionHistory.shift();
    }
    // Broadcast history update to client
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'history_update',
          history: sessionHistory,
        })
      );
    }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Live] Missing GEMINI_API_KEY');
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'API key is not configured on the server. Please check the Secrets panel in AI Studio.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let session: any = null;
  let isSessionActive = false;

  const candidateModels = ['gemini-3.1-flash-live-preview', 'gemini-3.8-live'];
  let currentModelTurnText = '';

  const connectToGeminiLive = async (voiceName = authenticatedUser?.preferredVoice || 'Aoede') => {
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[Live] Connecting to Gemini Live with model: ${model}, voice: ${voiceName}...`);
        const liveSession = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction: getSystemInstruction(
              authenticatedUser?.name,
              authenticatedUser?.preferredTheme
            ),
            // @ts-ignore
            tools: TOOLS_CONFIG,
            // @ts-ignore
            outputAudioTranscription: {},
            // @ts-ignore
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              console.log(`[Live] Gemini Live session opened (${model})`);
              isSessionActive = true;
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'session_ready',
                    model,
                    voice: voiceName,
                    sessionId,
                    user: authenticatedUser,
                  })
                );
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // 1. Audio stream chunks (PCM16 24kHz)
              const audioParts = message.serverContent?.modelTurn?.parts;
              if (audioParts) {
                for (const part of audioParts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        audio: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                      })
                    );
                  }
                  if (part.text) {
                    currentModelTurnText += part.text;
                  }
                }
              }

              // Handle server content text / transcriptions
              if ((message.serverContent as any)?.outputAudioTranscription?.text) {
                currentModelTurnText += (message.serverContent as any).outputAudioTranscription.text;
              }

              if ((message.serverContent as any)?.inputAudioTranscription?.text) {
                const userTranscript = (message.serverContent as any).inputAudioTranscription.text;
                pushTurn('user', userTranscript);
              }

              // 2. Interruption signal
              if (message.serverContent?.interrupted) {
                console.log('[Live] Model playback interrupted');
                if (currentModelTurnText) {
                  pushTurn('model', currentModelTurnText + ' (interrupted)');
                  currentModelTurnText = '';
                }
                clientWs.send(
                  JSON.stringify({
                    type: 'interrupted',
                  })
                );
              }

              // 3. Turn complete
              if (message.serverContent?.turnComplete) {
                if (currentModelTurnText) {
                  pushTurn('model', currentModelTurnText);
                  currentModelTurnText = '';
                }
                clientWs.send(
                  JSON.stringify({
                    type: 'turn_complete',
                  })
                );
              }

              // 4. Function/Tool calls
              if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
                console.log('[Live] Tool calls requested:', message.toolCall.functionCalls);
                const functionResponses: any[] = [];

                for (const call of message.toolCall.functionCalls) {
                  // Forward tool call to client for immediate browser action
                  clientWs.send(
                    JSON.stringify({
                      type: 'tool_call',
                      call: {
                        id: call.id,
                        name: call.name,
                        args: call.args,
                      },
                    })
                  );

                  let responseData: any = { success: true };
                  if (call.name === 'openWebsite') {
                    responseData = {
                      status: 'opened',
                      url: (call.args as any)?.url,
                      message: `Website ${(call.args as any)?.url} opened successfully in client browser.`,
                    };
                  } else if (call.name === 'changeAtmosphere') {
                    responseData = {
                      status: 'applied',
                      theme: (call.args as any)?.theme,
                      message: `Interface atmosphere changed to ${(call.args as any)?.theme}.`,
                    };
                  } else if (call.name === 'getDeviceStatus') {
                    responseData = {
                      status: 'ok',
                      localTime: new Date().toLocaleTimeString(),
                      localDate: new Date().toLocaleDateString(),
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      platform: 'Browser Web Client',
                    };
                  } else if (call.name === 'playAmbientSound') {
                    responseData = {
                      status: 'playing',
                      sound: (call.args as any)?.sound,
                      message: `Ambient sound ${(call.args as any)?.sound} is now active.`,
                    };
                  } else if (call.name === 'takeVoiceNote') {
                    responseData = {
                      status: 'saved',
                      note: (call.args as any)?.note,
                      message: `Note stored in memory core: "${(call.args as any)?.note}".`,
                    };
                  } else if (call.name === 'getConversationHistory') {
                    // Return recent turns so Lyraa can naturally recall earlier context
                    const recentTurns = sessionHistory.slice(-8).map((t) => ({
                      speaker: t.role === 'user' ? 'User' : 'Lyraa',
                      text: t.text,
                    }));
                    responseData = {
                      status: 'retrieved',
                      historyCount: recentTurns.length,
                      history: recentTurns,
                      contextSummary: `Last ${recentTurns.length} dialogue turns in current session.`,
                    };
                  }

                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: responseData,
                  });
                }

                // Send tool responses back to Gemini Live session immediately
                try {
                  liveSession.sendToolResponse({ functionResponses });
                } catch (toolErr) {
                  console.error('[Live] Error sending tool response to Gemini:', toolErr);
                }
              }
            },
            onclose: (e: any) => {
              console.log('[Live] Gemini session closed:', e);
              isSessionActive = false;
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'session_closed',
                    reason: e?.reason || 'Connection closed',
                  })
                );
              }
            },
            onerror: (err: any) => {
              console.error(`[Live] Gemini session error on model ${model}:`, err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    error: err?.message || 'Error in Gemini Live session',
                  })
                );
              }
            },
          },
        });

        session = liveSession;
        return;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Live] Failed to connect using ${model}, trying fallback if available...`, err?.message);
      }
    }

    if (!session) {
      throw lastError || new Error('Could not connect to any Gemini Live model');
    }
  };

  try {
    await connectToGeminiLive();
  } catch (initErr: any) {
    console.error('[Live] Fatal connection error:', initErr);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: `Failed to initiate Live session: ${initErr?.message || 'Unknown error'}`,
        })
      );
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());

      if (msg.type === 'audio' && msg.audio && session && isSessionActive) {
        // Stream 16kHz PCM audio chunk to Gemini Live
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (msg.type === 'user_transcript' && msg.text) {
        // Client-side detected user utterance or speech transcript
        pushTurn('user', msg.text);
      } else if (msg.type === 'switch_voice' && msg.voice) {
        if (session) {
          try {
            session.close();
          } catch {}
        }
        connectToGeminiLive(msg.voice).catch((err) => {
          clientWs.send(JSON.stringify({ type: 'error', error: err?.message }));
        });
      } else if (msg.type === 'client_tool_result' && session && isSessionActive) {
        if (msg.id && msg.name && msg.response) {
          try {
            session.sendToolResponse({
              functionResponses: [
                {
                  id: msg.id,
                  name: msg.name,
                  response: msg.response,
                },
              ],
            });
          } catch (err) {
            console.error('[Live] Error forwarding client tool result:', err);
          }
        }
      } else if (msg.type === 'ping') {
        clientWs.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (parseErr) {
      console.error('[Live] Error parsing client message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    console.log(`[Live] Client WS closed for session ${sessionId}`);
    isSessionActive = false;
    sessionHistories.delete(sessionId);
    if (session) {
      try {
        session.close();
      } catch (err) {
        console.error('[Live] Error closing session:', err);
      }
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Live] Client WS error:', err);
    if (session) {
      try {
        session.close();
      } catch {}
    }
  });
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Lyraa AI server listening on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
