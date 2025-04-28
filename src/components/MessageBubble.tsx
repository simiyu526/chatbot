import ReactMarkdown from "react-markdown";
import { FaClipboard } from "react-icons/fa";
import { useState } from "react";
type Message = {
  role: "user" | "ai" | "error";
  content: string;
  timestamp?: Date;
  id?: string;
};

interface MessageBubbleProps {
  message: Message;
  onErrorClick?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  onErrorClick,
}: MessageBubbleProps) {
  const handleClick = () => {
    if (message.role === "error" && onErrorClick) {
      onErrorClick(message);
    }
  };
const [visible,setVisible]=useState(false)
  const bubbleStyles = {
    user: "bg-slate-800 text-white rounded-br-none",
    ai: "text-zinc-900 break-words font-lg rounded-bl-none",
    error:
      "bg-red-300 text-black rounded-bl-none cursor-pointer hover:bg-red-200",
  };

  const timeStyles = {
    user: "text-blue-200",
    ai: "text-gray-500",
    error: "text-red-600",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/^[🚫✅🤖] /, ""));
    alert("Coppied")
  };

  return (
    <>
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          bubbleStyles[message.role]
        }`}
        onClick={handleClick}
      >
        <div className="whitespace-pre-wrap">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className="flex space-x-2">
        <div className={`text-xs mt-1 ${timeStyles[message.role]}`}>
          {message.timestamp?.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <button onClick={() => copyToClipboard(message.content)}>
            <FaClipboard color="pink" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
