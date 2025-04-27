import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
};

type Props = {
  messages: Message[];
  onCopy: (text: string) => void;
};

const ChatMessages: React.FC<Props> = React.memo(({ messages, onCopy }) => {
  return (
    <>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`max-w-3xl p-3 rounded-lg shadow-md break-words ${
            msg.sender === 'user'
              ? 'bg-blue-100 dark:bg-blue-800 self-end text-right ml-auto'
              : 'bg-white dark:bg-gray-800 self-start text-left'
          }`}
        >
          <div className="text-xs opacity-50 mb-1">{msg.timestamp}</div>
          <ReactMarkdown
            children={msg.text}
            components={{
              code({ inline, className, children }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    {children}
                  </code>
                );
              },
            }}
          />
          <button
            onClick={() => onCopy(msg.text)}
            className="mt-2 text-xs text-blue-500 hover:underline"
          >
            📋 Copy
          </button>
        </div>
      ))}
    </>
  );
});

export default ChatMessages;
