import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";

interface Message {
  role: "user" | "assistant";
  content: string;
  code?: string;
  suggestion?: string;
}

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Welcome to AI Dev Mentor! Paste any code snippet and I'll analyze it for bugs, security risks, and best practice violations. I'll also explain what the code does and suggest improvements.",
  },
  {
    role: "user",
    content: "Can you review this function?",
    code: `function getUser(id) {\n  const query = "SELECT * FROM users WHERE id = " + id;\n  return db.execute(query);\n}`,
  },
  {
    role: "assistant",
    content: "🚨 **SQL Injection Vulnerability Detected**\n\nThis function concatenates user input directly into an SQL query, making it vulnerable to SQL injection attacks. An attacker could pass malicious input like `1; DROP TABLE users;` to execute arbitrary SQL.\n\n**What you should know:**\nAlways use parameterized queries or prepared statements. This prevents user input from being interpreted as SQL code.",
    suggestion: `function getUser(id: string) {\n  const query = "SELECT * FROM users WHERE id = $1";\n  return db.execute(query, [id]);\n}`,
  },
];

export default function Mentor() {
  const [messages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <Bot className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Dev Mentor</h1>
          <p className="text-xs text-muted-foreground">Paste code, learn best practices, fix issues</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] space-y-3 ${msg.role === "user" ? "" : ""}`}>
              <div className={`rounded-xl p-4 ${msg.role === "user" ? "bg-primary/10 border border-primary/20" : "gradient-card border border-border"}`}>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.code && <CodeBlock code={msg.code} />}
              {msg.suggestion && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-success" />
                    <span className="text-xs font-semibold text-success">Suggested Fix</span>
                  </div>
                  <CodeBlock code={msg.suggestion} variant="after" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="gradient-card rounded-xl border border-border p-3 flex items-center gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste code or ask a question..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none font-mono min-h-[40px] max-h-[120px]"
          rows={1}
        />
        <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
