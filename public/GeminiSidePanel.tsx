import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  SunIcon,
  MoonIcon,
  PaperClipIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/solid';
import ChatMessages from './ChatMessage';
import { format } from 'date-fns';
import SidePanel from './SidePanel';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
};

const schema = z.object({
  message: z.string().min(1, 'Message is required'),
});

type FormData = z.infer<typeof schema>;

const Gemini: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTimestamp = () => {
    return format(new Date(), 'PP – HH:mm');
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const onSubmit = async (data: FormData) => {
    const userMessage: Message = {
      sender: 'user',
      text: data.message,
      timestamp: getTimestamp(),
    };

    const thinkingMessage: Message = {
      sender: 'bot',
      text: '⏳ Generating...',
      timestamp: getTimestamp(),
    };

    const newMessages = [...messages, userMessage, thinkingMessage];
    setMessages(newMessages);
    reset();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/chat', {
        message: data.message,
      });

      const botMessage: Message = {
        sender: 'bot',
        text: res.data.generated_text,
        timestamp: getTimestamp(),
      };

      setTimeout(() => {
        const finalMessages = [...messages, userMessage, botMessage];
        setMessages(finalMessages);
        speak(botMessage.text);
        saveChatSession(finalMessages);
      }, 1000);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          sender: 'bot',
          text: '⚠️ Server error. Try again later.',
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveChatSession = async (chatMessages: Message[]) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/chat/save',
        {
          messages: chatMessages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error('Failed to save chat:', err);
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/chat/session/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sessionMessages: Message[] = res.data.map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: format(new Date(msg.timestamp), 'PP – HH:mm'),
      }));

      setMessages(sessionMessages);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle('dark', !isDarkTheme);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row">
      {/* 🧾 Side Panel */}
      <SidePanel onSelectSession={loadSessionMessages} />

      {/* 💬 Main Chat Window */}
      <div
        className={`flex-1 flex flex-col ${
          isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 text-center font-bold text-xl relative">
          Gemini Chat
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          >
            {isDarkTheme ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <ChatMessages messages={messages} onCopy={handleCopy} />
          <div ref={endRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex gap-2 p-4 border-t dark:border-gray-700"
        >
          <input
            {...register('message')}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
        </form>
        {errors.message && (
          <p className="text-red-500 text-sm text-center -mt-2">
            {errors.message.message}
          </p>
        )}

        {/* Voice Controls */}
        <div className="flex justify-center gap-4 py-2">
          {isPlaying ? (
            <button
              onClick={stopSpeaking}
              className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700"
            >
              <StopIcon className="h-6 w-6" />
            </button>
          ) : (
            <button
              onClick={() =>
                speak(messages[messages.length - 1]?.text || '')
              }
              className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700"
            >
              <PlayIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        <audio ref={audioRef} src="/ding.mp3" preload="auto" />
      </div>
    </div>
  );
};

export default Gemini;
