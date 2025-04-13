import React from "react";
import {
  FaHandPaper, FaMinus, FaPlus, FaMapMarkerAlt,
  FaExpandArrowsAlt, FaSmile, FaUser
} from "react-icons/fa";
import { useReactFlow, useStore } from "reactflow";

export const BottomControls = () => {
  const { zoomIn, zoomOut, getZoom } = useReactFlow();

  // ✅ Get zoom level from the React Flow store
  const zoom = useStore((state) => state.transform[2]); // state.transform = [x, y, zoom]

  const handleZoomIn = () => zoomIn();
  const handleZoomOut = () => zoomOut();

  return (
    <div className="absolute bottom-4 right-4 bg-white border border-gray-300 px-4 py-2 rounded-lg flex items-center space-x-4 shadow-md z-10">
      <FaHandPaper size={18} className="text-gray-700 cursor-pointer hover:bg-gray-100 rounded" />
      <div className="w-px h-6 bg-gray-300" />
      <FaMapMarkerAlt size={18} className="text-gray-700 cursor-pointer hover:bg-gray-100 rounded" />
      <div className="w-px h-6 bg-gray-300" />
      <FaMinus size={14} className="text-gray-700 cursor-pointer hover:bg-gray-100 rounded" onClick={handleZoomOut} />
      <span className="text-sm font-small w-10 text-center">{Math.round(zoom * 100)}%</span>
      <FaPlus size={14} className="text-gray-700 cursor-pointer hover:bg-gray-100 rounded" onClick={handleZoomIn} />
      <div className="w-px h-6 bg-gray-300" />
      <FaExpandArrowsAlt size={18} className="text-gray-700 cursor-pointer hover:bg-gray-100 rounded" />
    </div>
  );
};

export const Footer = () => (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 px-4 py-2 rounded-lg flex items-center space-x-4 shadow-md z-10">
    <FaSmile size={22} className="text-gray-700 cursor-pointer" />
    <div className="w-px h-6 bg-gray-300" />
    <FaUser size={20} className="bg-green-500 text-white rounded-full p-1" />
  </div>
);