import React, { useState } from 'react';
import './App.css';

interface Message {
  role: 'user' | 'aethel';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [latency, setLatency] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setThoughts(['Initiating Aethel link...']);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error('Aethel Engine Connection Failed');

      const data = await response.json();
      
      // Visualizing thoughts with a slight delay for kinetic effect
      for (const thought of data.thoughts) {
        setThoughts((prev) => [...prev, thought]);
        await new Promise((r) => setTimeout(r, 150));
      }

      const botMessage: Message = { role: 'aethel', content: data.response };
      setMessages((prev) => [...prev, botMessage]);
      setLatency(data.latency_ms);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { role: 'aethel', content: 'SYSTEM ERROR: ENGINE DISCONNECTED' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setThoughts([]), 2000); // Keep thoughts visible briefly
    }
  };

  return (
    <div className="aethel-container">
      {/* Sidebar - Thought Stream */}
      <aside className="thought-stream">
        <header className="brutalist-header">THOUGHT_STREAM</header>
        <div className="thought-list">
          {thoughts.map((t, i) => (
            <div key={i} className="thought-item">{`> ${t}`}</div>
          ))}
        </div>
        <div className="performance-hud">
          <div>LATENCY: {latency}ms</div>
          <div>STATUS: {isProcessing ? 'PROCESSING' : 'READY'}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AETHEL_CORE_V1.0</div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="brutalist-header main-header">AETHEL</header>
        <div className="message-list">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h1>AETHEL</h1>
              <p>The next evolution of AI is here. Command Aethel below.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`message-card ${m.role}`}>
              <span className="role-tag">{m.role === 'aethel' ? 'AETHEL' : m.role.toUpperCase()}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {isProcessing && <div className="processing-indicator">AETHEL IS THINKING...</div>}
        </div>
        <div className="input-container">
          <input
            className="neo-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isProcessing ? "AETHEL BUSY..." : "COMMAND AETHEL..."}
            disabled={isProcessing}
          />
          <button onClick={sendMessage} disabled={isProcessing}>
            {isProcessing ? '...' : 'SEND'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
