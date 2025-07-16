"use client";

import { useEffect, useRef } from "react";
import * as go from "gojs";

export default function TestPage() {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    const diagram = new go.Diagram(diagramRef.current, {
      initialContentAlignment: go.Spot.Center,
    });

    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(go.Shape, "Circle", { fill: "lightblue", width: 100, height: 100 }),
      $(go.TextBlock, "Test Node", { margin: 5 })
    );

    diagram.model = new go.GraphLinksModel([{ key: 1, text: "Test Node" }]);

    return () => {
      diagram.div = null;
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <h1 className="text-2xl p-4">GoJS Test Page</h1>
      <div
        ref={diagramRef}
        className="w-full h-[600px] border border-gray-300"
      />
    </div>
  );
}
