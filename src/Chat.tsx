import { useState, useEffect, useRef } from "react";
import { generateContent } from "./utils/geminiClient";
import ChatHeader from "./components/ChatHeader";
import BlockNotice from "./components/BlockNotice";
import MessagesList from "./components/MessageList";
import InputArea from "./components/InputArea";

type Message = {
  role: "user" | "ai" | "error";
  content: string;
  timestamp?: Date;
  id?: string;
};

const MAX_REQUESTS = 20;
const BLOCK_TIME_MS = 24 * 60 * 60 * 1000; // 1 day

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
          }))
        );
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }

    const blockUntil = localStorage.getItem("blockUntil");
    if (blockUntil) {
      const blockUntilTime = parseInt(blockUntil);
      if (Date.now() < blockUntilTime) {
        setIsBlocked(true);
        setBlockTimeLeft(blockUntilTime - Date.now());
      } else {
        localStorage.removeItem("blockUntil");
        localStorage.removeItem("requestCount");
        localStorage.removeItem("firstRequestTime");
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isBlocked) return;
    const interval = setInterval(() => {
      const blockUntil = parseInt(localStorage.getItem("blockUntil") || "0");
      const timeLeft = blockUntil - Date.now();
      setBlockTimeLeft(timeLeft);
      if (timeLeft <= 0) {
        setIsBlocked(false);
        localStorage.removeItem("blockUntil");
        localStorage.removeItem("requestCount");
        localStorage.removeItem("firstRequestTime");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlocked]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (isBlocked) {
      alert(`You have reached the message limit. Please try again later.`);
      return;
    }

    const requestCount = parseInt(localStorage.getItem("requestCount") || "0");
    const firstRequestTime = parseInt(localStorage.getItem("firstRequestTime") || "0");

    if (!firstRequestTime || Date.now() - firstRequestTime > BLOCK_TIME_MS) {
      localStorage.setItem("firstRequestTime", Date.now().toString());
      localStorage.setItem("requestCount", "1");
    } else if (requestCount >= MAX_REQUESTS) {
      localStorage.setItem("blockUntil", (Date.now() + BLOCK_TIME_MS).toString());
      setIsBlocked(true);
      alert("You have reached the maximum number of messages. Please wait 24 hours.");
      return;
    } else {
      localStorage.setItem("requestCount", (requestCount + 1).toString());
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await generateContent(input);
      const aiMessage: Message = {
        role: "ai",
        content: result || "No response.",
        timestamp: new Date(),
        id: Date.now().toString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "error",
        content: "Failed to get response. Click to retry.",
        timestamp: new Date(),
        id: Date.now().toString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear all messages?")) {
      setMessages([]);
      localStorage.removeItem("chatMessages");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-indigo-950">
      <ChatHeader clearChat={clearChat} hasMessages={messages.length > 0} />
      {isBlocked && <BlockNotice blockTimeLeft={blockTimeLeft} />}
      <MessagesList
        messages={messages}
        loading={loading}
        showScrollButton={showScrollButton}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          setShowScrollButton(target.scrollHeight - target.scrollTop - target.clientHeight > 100);
        }}
        onErrorClick={(message) => {
          setMessages((prev) => {
            const newMessages = prev.filter((m) => m.id !== message.id);
            const lastUserMessage = [...newMessages].reverse().find((m) => m.role === "user");
            if (lastUserMessage) {
              setInput(lastUserMessage.content);
              setTimeout(sendMessage, 100);
            }
            return newMessages;
          });
        }}
        scrollToBottom={scrollToBottom}
        messagesEndRef={messagesEndRef}
      />
      <InputArea
        input={input}
        setInput={setInput}
        loading={loading}
        isBlocked={isBlocked}
        sendMessage={sendMessage}
      />
    </div>
  );
}
