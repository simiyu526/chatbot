import {FaTrash} from "react-icons/fa"
import myPic from "../assets/nekebot.svg"
interface ChatHeaderProps {
    clearChat: () => void;
    hasMessages: boolean;
  }
  
  export default function ChatHeader({ clearChat, hasMessages }: ChatHeaderProps) {

    
    return (
      <div className="bg-indigo-500 shadow-sm p-4 flex justify-between items-center">
        <div className="flex space-x-1">
        <h1 className="text-xl font-bold text-zinc-900 italic">NEKEBOT</h1>
        <img src={myPic} alt="Nekebot" width={20} height={20} />
        </div>
        {hasMessages && (
          <button
            onClick={clearChat}
            className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            <FaTrash color="lightblue" size={22} />
          </button>
          
        )}
      </div>
    );
  }
  