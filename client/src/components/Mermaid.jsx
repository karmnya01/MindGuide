import React, { useState, useEffect } from "react";
import Mermaid from "react-mermaid2";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faCircle } from "@fortawesome/free-solid-svg-icons";

const MernRoadmap = () => {
  const [tasks, setTasks] = useState({});
  const [mermaidCode, setMermaidCode] = useState("");

  useEffect(() => {
    const parsedTasks = {};
    const code = `
    graph RL;
A[Front-End Development] --> B(HTML and CSS Basics)
A --> C(JavaScript Fundamentals)
A --> D(React Basics)
D --> E(React Router)
A --> F(Node.js Fundamentals)
F --> G(Express Server Setup)
G --> H(RESTful APIs Basics)
A --> I(Connecting Express with MongoDB)
I --> J(CRUD Operations with MongoDB)
I --> K(Basic Full-Stack Application)
A --> L(User Authentication with JWT)
A --> M(Redux State Management)
A --> N(Deploying MERN App)
N --> O(Cloud Platforms)
A --> P(Personal Project)
P --> Q(Engaging Developer Communities)
    `;

    // Parse the Mermaid code to extract tasks
    const lines = code.split("\n");
    lines.forEach((line) => {
      const matches = line.match(/\[([^\]]+)\]/);
      if (matches && matches.length > 1) {
        parsedTasks[matches[1]] = false;
      }
    });

    setTasks(parsedTasks);
    setMermaidCode(code);
  }, []);

  const handleCheckboxChange = (task) => {
    setTasks((prevTasks) => ({ ...prevTasks, [task]: !prevTasks[task] }));
  };

  const allTasksCompleted = Object.values(tasks).every((task) => task);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-[#111827] border border-slate-800 rounded-[2rem] shadow-2xl">
      <div className="flex items-center justify-center p-6 bg-[#0B0F19] rounded-3xl border border-slate-800 mb-10 overflow-x-auto custom-scrollbar">
        {mermaidCode?.length > 0 && (
          <div className="min-w-[600px] invert hue-rotate-180 opacity-80 contrast-125">
             <Mermaid className="w-full" chart={mermaidCode} />
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
          </div>
          Curriculum Progress
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(tasks).map(([task, isChecked]) => (
            <motion.div 
              key={task}
              whileHover={{ x: 5 }}
              onClick={() => handleCheckboxChange(task)}
              className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                isChecked 
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" 
                  : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isChecked ? "text-indigo-400" : "text-slate-600"}`}>
                <FontAwesomeIcon icon={isChecked ? faCheckCircle : faCircle} />
              </div>
              <span className="font-medium text-sm">{task}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <button
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
          allTasksCompleted 
            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20" 
            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
        }`}
        disabled={!allTasksCompleted}
      >
        {allTasksCompleted ? "Certificate Earned!" : "Complete All Tasks to Unlock"}
      </button>
    </div>
  );
};

export default MernRoadmap;
