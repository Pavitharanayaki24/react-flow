import React from "react";
import { FaUndo, FaRedo, FaCut, FaCopy, FaPaste, FaBolt } from "react-icons/fa";

type TopBarProps = {
  title: string;
  setTitle: (title: string) => void;
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
};
const TopBar = ({ title, setTitle, undo, redo, cut, copy, paste }: TopBarProps) =>  (
  <div className="absolute top-2 left-4 bg-white border border-gray-200 h-12 px-4 py-2 flex items-center space-x-2 rounded-lg z-10">
    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" />
    <div className="w-px h-6 bg-gray-300 mx-2" />
    <button onClick={() => {
        console.log("Undo clicked");
        undo();
      }} className="p-1 hover:bg-gray-200 rounded"><FaUndo size={14} /></button>
    <button  onClick={() => {
        console.log("Redo clicked");
        redo();
      }}
      className="p-1 hover:bg-gray-200 rounded"><FaRedo size={14} /></button>
     <button onClick={cut} className="p-1 hover:bg-gray-100 rounded" title="Cut"><FaCut size={14} /></button>
    <button onClick={copy} className="p-1 hover:bg-gray-100 rounded" title="Copy"><FaCopy size={14} /></button>
    <button onClick={paste} className="p-1 hover:bg-gray-100 rounded" title="Paste"><FaPaste size={14} /></button>
    <div className="w-px h-6 bg-gray-300 mx-2" />
    <button className="p-1 bg-black-100 text-black-600 rounded hover:bg-black-200"><FaBolt size={14} /></button>
  </div>
);

export default TopBar;