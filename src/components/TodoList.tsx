import React, { useEffect } from "react";
import { todoStore } from "../stores/todoStore";

const TodoList = () => {
  const { data, isLoading, isError, error, refetch } = todoStore.useFetch();

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading) {
    return <div>Loading todos...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div
      style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "6px" }}
    >
      <h2>Todo List</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map((todo) => (
          <li key={todo.id}>
            <input type="checkbox" checked={todo.completed} readOnly />
            <span>{todo.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
