import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageUpload from "./components/ImageUpload";
import EnhancementHistory from "./components/EnhancementHistory";
import { Toaster } from "./components/ui/toaster";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <ImageUpload />
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <EnhancementHistory />
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;