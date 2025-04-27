interface ChatHeaderProps {
    clearChat: () => void;
    hasMessages: boolean;
  }
  
  export default function ChatHeader({ clearChat, hasMessages }: ChatHeaderProps) {
    return (
      <div className="bg-indigo-950 shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Nekebot</h1>
        {hasMessages && (
          <button
            onClick={clearChat}
            className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>
    );
  }
  