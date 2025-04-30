import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { useAdvancedPostStore } from "../stores/advancedPostStore";
import { QueryBuilder } from "../utils/queryBuilder";
import { Post, PostFilters, PaginatedResponse } from "../types/post";

const AdvancedPostList: React.FC = () => {
  const [filters, setFilters] = useState<PostFilters>({
    page: 1,
    limit: 10,
    sortBy: "id",
    sortDirection: "asc",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    posts,
    loading: storeLoading,
    error: storeError,
    fetchPosts,
    createPost,
    deletePost,
  } = useAdvancedPostStore();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchPosts(filters);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [filters, fetchPosts]);

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleSort = (field: keyof Post) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDirection:
        prev.sortBy === field && prev.sortDirection === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      await createPost({
        ...newPost,
        userId: 1,
      });
      setNewPost({ title: "", body: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      setError(null);
      await deletePost(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const paginatedPosts: PaginatedResponse<Post> | undefined = posts
    ? {
        data: posts,
        total: posts.length,
        totalPages: Math.ceil(posts.length / (filters.limit || 10)),
        currentPage: filters.page || 1,
        limit: filters.limit || 10,
      }
    : undefined;

  if (storeError) {
    return <div className="error">Error loading posts: {storeError}</div>;
  }

  return (
    <div className="advanced-post-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search posts..."
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={filters.sortBy}
          onChange={(e) => handleSort(e.target.value as keyof Post)}
          className="sort-select"
        >
          <option value="id">ID</option>
          <option value="title">Title</option>
          <option value="userId">User ID</option>
        </select>

        <select
          value={filters.sortDirection}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              sortDirection: e.target.value as "asc" | "desc",
            }))
          }
          className="direction-select"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <form onSubmit={handleCreatePost} className="create-post-form">
        <input
          type="text"
          placeholder="Post title"
          value={newPost.title}
          onChange={(e) =>
            setNewPost((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
        <textarea
          placeholder="Post body"
          value={newPost.body}
          onChange={(e) =>
            setNewPost((prev) => ({ ...prev, body: e.target.value }))
          }
          required
        />
        <button type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Post"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <div className="posts">
          {paginatedPosts?.data.map((post: Post) => (
            <div key={post.id} className="post">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div className="post-meta">
                <span>User ID: {post.userId}</span>
                {post.createdAt && (
                  <span>
                    Created: {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                )}
                {post.updatedAt && (
                  <span>
                    Updated: {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button onClick={() => handleDeletePost(post.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          onClick={() => handlePageChange((filters.page || 1) - 1)}
          disabled={(filters.page || 1) <= 1}
        >
          Previous
        </button>
        <span>Page {filters.page || 1}</span>
        <button
          onClick={() => handlePageChange((filters.page || 1) + 1)}
          disabled={(filters.page || 1) >= (paginatedPosts?.totalPages || 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdvancedPostList;
