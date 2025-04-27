import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { generateContent } from "../utils/geminiClient";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
  role: "user" | "ai" | "error";
  content: string;
  timestamp?: Date;
  id?: string;
};

const MAX_REQUESTS = 10;
const BLOCK_TIME_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
        })));
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }

    const blockUntil = localStorage.getItem('blockUntil');
    if (blockUntil) {
      const blockUntilTime = parseInt(blockUntil);
      if (Date.now() < blockUntilTime) {
        setIsBlocked(true);
        setBlockTimeLeft(blockUntilTime - Date.now());
      } else {
        localStorage.removeItem('blockUntil');
        localStorage.removeItem('requestCount');
        localStorage.removeItem('firstRequestTime');
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isBlocked) return;
    const interval = setInterval(() => {
      const blockUntil = parseInt(localStorage.getItem('blockUntil') || '0');
      const timeLeft = blockUntil - Date.now();
      setBlockTimeLeft(timeLeft);
      if (timeLeft <= 0) {
        setIsBlocked(false);
        localStorage.removeItem('blockUntil');
        localStorage.removeItem('requestCount');
        localStorage.removeItem('firstRequestTime');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlocked]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (isBlocked) {
      alert(`You have reached the message limit. Please try again later.`);
      return;
    }

    const requestCount = parseInt(localStorage.getItem('requestCount') || '0');
    const firstRequestTime = parseInt(localStorage.getItem('firstRequestTime') || '0');

    if (!firstRequestTime || Date.now() - firstRequestTime > BLOCK_TIME_MS) {
      localStorage.setItem('firstRequestTime', Date.now().toString());
      localStorage.setItem('requestCount', '1');
    } else if (requestCount >= MAX_REQUESTS) {
      localStorage.setItem('blockUntil', (Date.now() + BLOCK_TIME_MS).toString());
      setIsBlocked(true);
      alert('You have reached the maximum number of messages. Please wait 1 hour.');
      return;
    } else {
      localStorage.setItem('requestCount', (requestCount + 1).toString());
    }

    const userMessage: Message = { 
      role: "user", 
      content: input,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await generateContent(input);
      const aiMessage: Message = { 
        role: "ai", 
        content: result,
        timestamp: new Date(),
        id: Date.now().toString()
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "error",
        content: "Failed to get response. Click to retry.",
        timestamp: new Date(),
        id: Date.now().toString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  const clearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Nekebot</h1>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Block Notice */}
      {isBlocked && (
        <div className="bg-red-100 text-red-700 text-center text-sm p-2">
          You are blocked. Try again in {Math.ceil(blockTimeLeft / 60000)} minutes.
        </div>
      )}

      {/* Messages container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          setShowScrollButton(
            target.scrollHeight - target.scrollTop - target.clientHeight > 100
          );
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-center p-6 max-w-md">
              <h2 className="text-xl font-medium mb-2">Start a conversation</h2>
              <p className="text-sm">Ask anything and Nekebot will respond to you here.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl rounded-lg px-4 py-3 ${msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none" 
                : msg.role === "ai" 
                  ? "bg-white text-gray-800 shadow rounded-bl-none border border-gray-100"
                  : "bg-red-100 text-red-800 rounded-bl-none cursor-pointer hover:bg-red-200"
              }`}
              onClick={msg.role === "error" ? () => {
                setMessages(prev => {
                  const newMessages = prev.filter(m => m.id !== msg.id);
                  const lastUserMessage = [...newMessages].reverse().find(m => m.role === "user");
                  if (lastUserMessage) {
                    setInput(lastUserMessage.content);
                    setTimeout(sendMessage, 100);
                  }
                  return newMessages;
                });
              } : undefined}
            >
              <div className="whitespace-pre-wrap">
                <ReactMarkdown 
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter style={solarizedlight} language={match[1]} PreTag="div" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div className={`text-xs mt-1 ${msg.role === "user" ? 'text-blue-200' : 
                msg.role === "ai" ? 'text-gray-500' : 'text-red-600'}`}>
                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow rounded-lg px-4 py-3 max-w-xs rounded-bl-none border border-gray-100">
              <div className="flex space-x-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ask Nekebot anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
              disabled={loading || isBlocked}
            />
            {input.length > 0 && (
              <div className="absolute right-2 bottom-2 text-xs text-gray-400 bg-white px-1 rounded">
                {input.length}/500
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || isBlocked}
            className={`px-5 py-3 rounded-lg font-medium ${loading || !input.trim() || isBlocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mx-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
