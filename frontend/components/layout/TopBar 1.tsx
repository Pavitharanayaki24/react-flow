import React from "react";
import { FaUndo, FaRedo, FaCut, FaCopy, FaPaste, FaBolt, FaEye,  FaProjectDiagram } from "react-icons/fa";

type TopBarProps = {
  title: string;
  setTitle: (title: string) => void;
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  onPreview: () => void;
  onEChange: () => void;
  onEdgeTypeSelect: () => void;
};

const TopBar = ({ title, setTitle, undo, redo, cut, copy, paste, onPreview, onEChange, onEdgeTypeSelect }: TopBarProps) => (
  <div className="absolute top-2 left-4 bg-white border border-gray-200 h-12 px-4 py-2 flex items-center space-x-2 rounded-lg z-10">
    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" />
    <div className="w-px h-6 bg-gray-300 mx-2" />
    <button onClick={undo} className="p-1 hover:bg-gray-200 rounded"><FaUndo size={14} /></button>
    <button onClick={redo} className="p-1 hover:bg-gray-200 rounded"><FaRedo size={14} /></button>
    <button onClick={cut} className="p-1 hover:bg-gray-100 rounded" title="Cut"><FaCut size={14} /></button>
    <button onClick={copy} className="p-1 hover:bg-gray-100 rounded" title="Copy"><FaCopy size={14} /></button>
    <button onClick={paste} className="p-1 hover:bg-gray-100 rounded" title="Paste"><FaPaste size={14} /></button>
    <div className="w-px h-6 bg-gray-300 mx-2" />
    <button onClick={onPreview} className="p-1 hover:bg-gray-100 rounded" title="Preview"><FaEye size={14} /></button>
    <button onClick={onEChange} className="p-1 hover:bg-gray-100 rounded" title="Edge Options"><FaBolt size={14} /></button>
    <button onClick={onEdgeTypeSelect} className="p-1 hover:bg-gray-100 rounded" title="Edge Type"><FaProjectDiagram size={14} /></button>
  </div>
);

export default TopBar;