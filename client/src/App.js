import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  state = {
    products: []
  };
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <a>
          <p>OK?</p>
        </a>
      </header>
    </div>
  );
}

export default App;
