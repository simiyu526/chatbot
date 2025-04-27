import { BsSend } from "react-icons/bs";

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  isBlocked: boolean;
  sendMessage: () => void;
}

export default function InputArea({
  input,
  setInput,
  loading,
  isBlocked,
  sendMessage,
}: InputAreaProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  return (
    <div className="p-4 bg-indigo-950">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Ask Nekebot anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="bg-indigo-950 text-white w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className={`px-5 py-3 rounded-lg font-medium ${
            loading || !input.trim() || isBlocked
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } transition-colors`}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white mx-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <BsSend size={25} />
          )}
        </button>
      </div>
    </div>
  );
}
