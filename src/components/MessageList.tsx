import MessageBubble from "./MessageBubble";
import myBot from "../assets/nekebot.svg"
type Message = {
  role: "user" | "ai" | "error";
  content: string;
  timestamp?: Date;
  id?: string;
};

interface MessagesListProps {
  messages: Message[];
  loading: boolean;
  showScrollButton: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onErrorClick: (message: Message) => void;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessagesList({
  messages,
  loading,
  showScrollButton,
  onScroll,
  onErrorClick,
  scrollToBottom,
  messagesEndRef,
}: MessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={onScroll}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <img src={myBot} alt="Bot" width={100} height={100} />

          <div className="text-center p-6 max-w-md">
            <h2 className="text-2xl font-medium mb-2">Start a conversation</h2>
            <p className="text-sm">Ask anything and Nekebot will respond to you here.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onErrorClick={onErrorClick} />
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="bg-white shadow rounded-lg px-4 py-3 max-w-xs rounded-bl-none border border-gray-100">
            <div className="flex space-x-1 items-center">
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
