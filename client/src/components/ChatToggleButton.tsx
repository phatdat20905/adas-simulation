import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function ChatToggleButton() {
  const [visible, setVisible] = useState(false);

  const toggleChat = () => {
    setVisible((prev) => !prev);

    // Messenger widget
    const fbChat = document.getElementById("fb-customer-chat");
    if (fbChat) {
      fbChat.style.display = visible ? "none" : "block";
    }

    // Zalo widget
    const zaloChat = document.querySelector<HTMLElement>(".zalo-chat-widget");
    if (zaloChat) {
      zaloChat.style.display = visible ? "none" : "block";
    }
  };

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
