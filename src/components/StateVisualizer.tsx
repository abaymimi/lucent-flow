import React, { useEffect, useRef } from "react";
import { StoreApi } from "zustand";
import { StateVisualizer as StateVisualizerUtil } from "../utils/stateVisualizer";

interface Props {
  // Generic type parameter for store state
  store: StoreApi<unknown>;
  config?: {
    maxHistory?: number;
    trackMemory?: boolean;
    trackPerformance?: boolean;
  };
}

export const StateVisualizerComponent: React.FC<Props> = ({
  store,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<StateVisualizerUtil<object> | null>(null);

  useEffect(() => {
    if (!visualizerRef.current) {
      visualizerRef.current = new StateVisualizerUtil<object>(
        store as StoreApi<object>,
        config
      );
    }

    const visualizer = visualizerRef.current;
    if (!visualizer) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const drawGraph = () => {
      const graph = visualizer.getGraph();
      const timeline = visualizer.getTimeline();
      const performance = visualizer.getPerformanceMetrics();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw state nodes
      graph.nodes.forEach((node, index) => {
        const x = 50 + index * 150;
        const y = 50;

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#4CAF50";
        ctx.fill();
        ctx.stroke();

        // Draw node label
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(node.name, x, y + 40);
      });

      // Draw timeline
      const timelineHeight = 200;
      const timelineY = canvas.height - timelineHeight;
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, timelineY, canvas.width, timelineHeight);

      timeline.forEach((entry, index) => {
        const x = (index * 50) % canvas.width;
        const height = (entry.performance.memoryUsage / 1000000) * 10; // Scale for visibility
        ctx.fillStyle = "#2196F3";
        ctx.fillRect(x, timelineY + timelineHeight - height, 40, height);
      });

      // Draw performance metrics
      ctx.fillStyle = "#000";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        `Update Time: ${performance.updateTime.toFixed(2)}ms`,
        10,
        30
      );
      ctx.fillText(
        `Memory Usage: ${(performance.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        10,
        50
      );
      ctx.fillText(`Render Count: ${performance.renderCount}`, 10, 70);

      requestAnimationFrame(drawGraph);
    };

    drawGraph();

    return () => {
      visualizer.cleanup();
    };
  }, [store, config]);

  return (
    <div className="state-visualizer">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
};
