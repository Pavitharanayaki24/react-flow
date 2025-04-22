import { Edge, Node } from 'reactflow';

// Auto-save function
export function autoSaveGraph(nodes: Node[], edges: Edge[]) {
    const graphData = {
        nodes,
        edges
    };
    localStorage.setItem("autosave.arcio", JSON.stringify(graphData));
}

// Export Save Function
export function saveGraph(nodes: Node[], edges: Edge[]) {
    const graphData = {
        nodes,
        edges
    };
    localStorage.setItem("autosave.arcio", JSON.stringify(graphData));
    
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arch.arcio";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up memory
    showMessage("Graph saved successfully as .arcio file!", "success");
}

// Function to auto-load the graph from localStorage
export const loadSavedGraph = (setNodes: (nodes: Node[]) => void, setEdges: (edges: Edge[]) => void) => {
    const savedData = localStorage.getItem("autosave.arcio");
    if (savedData) {
        try {
            const { nodes, edges } = JSON.parse(savedData);
            setNodes(nodes);
            setEdges(edges);
            showMessage("Continue your graph from where you left!", "info");
        } catch (error) {
            console.error("Error parsing saved data:", error);
            showMessage("Error loading saved graph", "error");
        }
    } else {
        showMessage("Start creating a graph!", "info");
    }
};

export const loadGraph = (setNodes: (nodes: Node[]) => void, setEdges: (edges: Edge[]) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".arcio";
    input.onchange = (event) => {
        const file = event.target?.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const { nodes, edges } = JSON.parse(e.target?.result as string);
                    setNodes(nodes);
                    setEdges(edges);
                    showMessage("Graph loaded successfully!", "success");
                } catch (error) {
                    console.error("Error loading graph:", error);
                    showMessage("Failed to load the graph. Please try again.", "error");
                }
            };
            reader.readAsText(file);
        } else {
            showMessage("No file selected. Please try again.", "error");
        }
    };
    document.body.appendChild(input);
    input.style.display = "none";
    input.click();
    setTimeout(() => document.body.removeChild(input), 1000);
}; 

export function showMessage(message: string, type: "info" | "success" | "error" = "info") {
    let messageBox = document.getElementById("message-box");
    let messageText = document.getElementById("message-text");
    let closeButton = document.getElementById("close-message");
    if (!messageBox || !messageText || !closeButton) {
        console.error("Message box elements not found!");
        return;
    }
    messageText.textContent = message;
    messageBox.classList.remove("hidden", "info", "success", "error");
    messageBox.classList.add(type);
    messageBox.style.visibility = "visible";
    messageBox.style.opacity = "1";
    let timeout = setTimeout(() => {
        hideMessage();
    }, 3000);
    closeButton.onclick = function () {
        clearTimeout(timeout);
        hideMessage();
    };
}

function hideMessage() {
    const messageBox = document.getElementById("message-box");
    if (messageBox) {
        messageBox.style.opacity = "0";
        messageBox.style.visibility = "hidden";
    }
}

export function ensureGraphReady() {
    return Promise.resolve(); // ReactFlow is always ready
}