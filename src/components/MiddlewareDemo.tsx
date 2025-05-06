import React from "react";
import { useExampleStore } from "../stores/exampleStore";

export const MiddlewareDemo: React.FC = () => {
  const { count, text, increment, decrement, setText, undo, redo } =
    useExampleStore.getState();

  return (
    <div className="middleware-demo">
      <h2>Middleware Demo</h2>

      <div className="counter-section">
        <h3>Counter (with undo/redo)</h3>
        <div className="counter">
          <button onClick={decrement}>-</button>
          <span>{count}</span>
          <button onClick={increment}>+</button>
        </div>
        <div className="undo-redo">
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
        </div>
      </div>

      <div className="text-section">
        <h3>Text Input (with throttle)</h3>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something..."
        />
        <p>Current text: {text}</p>
      </div>

      <div className="info">
        <p>Open the browser console to see the logger middleware in action</p>
        <p>Open Redux DevTools to see the state history</p>
      </div>
    </div>
  );
};
