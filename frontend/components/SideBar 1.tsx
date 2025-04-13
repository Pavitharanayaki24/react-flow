import React, { useState } from "react";
import { FaAws, FaShapes } from "react-icons/fa";
import { MdImage, MdEdit, MdSave, MdTextFields } from "react-icons/md";
import ShapeIconsPanel from "./ShapeIconsPanel 2";
import AwsIconsPanel from "./AwsIconsPanel 2";

const iconList = [
    { id: 1, title: "Square", src: "/sidebar/square.svg" },
    { id: 2, title: "Triangle", src: "/sidebar/triangle.svg" },
    { id: 3, title: "Circle", src: "/sidebar/circle.svg" },
    { id: 4, icon: <FaShapes size={24} />, title: "General Shapes" },
    { id: 5, icon: <FaAws size={24} />, title: "AWS Icons" },
    { id: 6, icon: <MdImage size={24} />, title: "Image" },
    { id: 7, icon: <MdEdit size={24} />, title: "Edit" },
    { id: 8, icon: <MdSave size={24} />, title: "Save" },
    { id: 9, icon: <MdTextFields size={24} />, title: "Text" },
  ];
  
  const Sidebar = ({
    onClickPlaceIcon,
  }: {
    onClickPlaceIcon: (icon: { iconSrc: string; title: string }) => void;
  }) => {
    const [selectedIconId, setSelectedIconId] = useState<number | null>(null);
  
    const handleIconClick = (id: number) => {
      setSelectedIconId((prev) => (prev === id ? null : id));
    };
  
    const handleMouseEnter = (e: React.MouseEvent<HTMLImageElement>, title: string) => {
      e.currentTarget.title = title;
    };
  
    const handleMouseLeave = (e: React.MouseEvent<HTMLImageElement>) => {
      e.currentTarget.title = "";
    };
  
    return (
      <div className="flex">
        <div className="fixed top-1/2 left-5 transform -translate-y-1/2 bg-black text-white flex flex-col py-4 space-y-4 shadow-lg rounded-lg p-4 z-10">
          {iconList.map((iconObj) => (
            <div key={iconObj.id}>
              {/* Render FontAwesome/Material Icons */}
              {iconObj.icon && (
                <button
                  onClick={() => handleIconClick(iconObj.id)}
                  title={iconObj.title}
                  className={`p-2 rounded transition-colors ${
                    selectedIconId === iconObj.id ? "bg-blue-500" : "hover:bg-gray-700"
                  }`}
                >
                  {iconObj.icon}
                </button>
              )}
  
              {/* Render Image Icons */}
              {iconObj.src && (
              <img
                src={iconObj.src}
                alt={iconObj.title}
                className="w-10 h-10 p-1 object-contain cursor-pointer rounded hover:scale-110 transition-transform"
                draggable
                onClick={() =>
                  onClickPlaceIcon({
                    iconSrc: `/shapes_icons/sharp_thin/shapes/${iconObj.src?.split('/').pop()}`,
                    title: iconObj.title!,
                  })
                }
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    "application/reactflow",
                    JSON.stringify({
                      type: iconObj.title.toLowerCase(),
                      iconSrc: `/shapes_icons/sharp_thin/shapes/${iconObj.src?.split('/').pop()}`,
                      title: iconObj.title,
                    })
                  )
                }              
                onMouseEnter={(e) => handleMouseEnter(e, iconObj.title!)}
                onMouseLeave={handleMouseLeave}
              />
            )}
            </div>
          ))}
        </div>
  
        {/* Panels */}
        {selectedIconId === 4 && (
          <ShapeIconsPanel onClose={() => setSelectedIconId(null)} onClickPlaceIcon={onClickPlaceIcon} />
        )}
        {selectedIconId === 5 && (
          <AwsIconsPanel onClose={() => setSelectedIconId(null)} onClickPlaceIcon={onClickPlaceIcon} />
        )}
      </div>
    );
  };  

export default Sidebar;