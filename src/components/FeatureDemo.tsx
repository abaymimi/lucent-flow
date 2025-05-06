import React, { useState } from "react";
import { useFeatureDemoStore } from "../stores/featureDemoStore";
import "./FeatureDemo.css";

export const FeatureDemo: React.FC = () => {
  const {
    items,
    filters,
    addItem,
    updateItem,
    deleteItem,
    setFilters,
    batchAddItems,
    getFilteredItems,
    getTotalValue,
  } = useFeatureDemoStore.getState();

  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    category: "electronics",
  });

  const filteredItems = getFilteredItems();
  const totalValue = getTotalValue();

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      ...newItem,
      lastUpdated: new Date(),
    });
    setNewItem({ name: "", price: 0, category: "electronics" });
  };

  const handleBatchAdd = () => {
    batchAddItems([
      {
        name: "Item 1",
        price: 100,
        category: "electronics",
        lastUpdated: new Date(),
      },
      {
        name: "Item 2",
        price: 200,
        category: "clothing",
        lastUpdated: new Date(),
      },
      {
        name: "Item 3",
        price: 300,
        category: "books",
        lastUpdated: new Date(),
      },
    ]);
  };

  return (
    <div className="feature-demo">
      <h2>Lucent Feature Demo</h2>

      <div className="controls">
        <div className="filters">
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters({ minPrice: Number(e.target.value) })}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
      </div>

      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) =>
            setNewItem({ ...newItem, price: Number(e.target.value) })
          }
        />
        <select
          value={newItem.category}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
        >
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
        <button type="submit">Add Item</button>
      </form>

      <button onClick={handleBatchAdd} className="batch-add">
        Batch Add Items
      </button>

      <div className="stats">
        <p>Total Items: {items.length}</p>
        <p>Filtered Items: {filteredItems.length}</p>
        <p>Total Value: ${totalValue}</p>
      </div>

      <div className="items-list">
        {filteredItems.map((item) => (
          <div key={item.id} className="item-card">
            <h3>{item.name}</h3>
            <p>Price: ${item.price}</p>
            <p>Category: {item.category}</p>
            <p>Last Updated: {item.lastUpdated?.toLocaleString()}</p>
            <div className="item-actions">
              <button
                onClick={() => updateItem(item.id, { price: item.price + 10 })}
              >
                Increase Price
              </button>
              <button onClick={() => deleteItem(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
