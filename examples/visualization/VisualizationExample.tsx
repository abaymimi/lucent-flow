import React from "react";
import { create } from "zustand";
import { StateVisualizerComponent } from "../../src/visualization";
import "./VisualizationExample.css";

// Create a sample store
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  addTodo: (text) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
  deleteTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    })),
}));

export function VisualizationExample() {
  const [newTodo, setNewTodo] = React.useState("");
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  return (
    <div className="visualization-example">
      <div className="todo-app">
        <h2>Todo List</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
          />
          <button type="submit">Add</button>
        </form>
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className={todo.completed ? "completed" : ""}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="visualizer-container">
        <h3>State Visualization</h3>
        <StateVisualizerComponent
          store={useTodoStore}
          config={{
            maxHistory: 50,
            trackMemory: true,
            trackPerformance: true,
          }}
        />
      </div>
    </div>
  );
}
