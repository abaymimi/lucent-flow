import React from "react";
import { GraphQLPostList } from "./components/GraphQLPostList";
const App = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={{ padding: "1rem" }}>
        {/* <h1>Lucent-flow Test</h1>
        <Counter /> */}
        {/* <AdvancedPostList /> */}
        <GraphQLPostList />
      </div>
    </div>
  );
};

export default App;
