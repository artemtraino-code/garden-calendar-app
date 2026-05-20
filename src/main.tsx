import { createRoot } from "react-dom/client";
import { Design1 } from "./components/mockups/garden-cards/Design1";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found");
}

createRoot(root).render(<Design1 />);
