import React, { useEffect } from "react";
import { createGraphQLStore } from "../stores/graphqlStore";
import "./GraphQLPostList.css";

interface Post {
  id: number;
  title: string;
  body: string;
  user?: {
    id: string;
    name: string;
  };
}

const GET_POSTS_QUERY = `
  query GetPosts {
    posts {
      data {
        id
        title
        body
        user {
          id
          name
        }
      }
    }
  }
`;

const CREATE_POST_MUTATION = `
  mutation CreatePost($title: String!, $body: String!, $userId: ID!) {
    createPost(input: { title: $title, body: $body, userId: $userId }) {
      id
      title
      body
      user {
        id
        name
      }
    }
  }
`;

// Initialize store with proper endpoint
const postStore = createGraphQLStore<{ posts: { data: Post[] } }>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {},
  },
  cacheConfig: {
    ttl: 300000, // 5 minutes
    tags: ["posts"],
    revalidateOnFocus: true,
  },
  endpoint: "https://graphqlzero.almansi.me/api", // Using a public GraphQL API
});

export const GraphQLPostList: React.FC = () => {
  const { data, loading, error, fetchData, mutate } = postStore.getState();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePost = async () => {
    try {
      await mutate(CREATE_POST_MUTATION, {
        title: "New Post",
        body: "This is a new post created via GraphQL",
        userId: "1",
      });
      fetchData(); // Refresh the list
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  if (loading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div className="graphql-posts">
      <div className="posts-header">
        <h2>GraphQL Posts</h2>
        <button onClick={handleCreatePost} className="create-button">
          Create New Post
        </button>
      </div>

      <div className="posts-grid">
        {data?.posts.data.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h3 className="post-title">{post.title}</h3>
              <div className="post-author">
                <span className="author-label">Author:</span>
                <span className="author-name">{post.user?.name}</span>
              </div>
            </div>
            <div className="post-body">
              <p>{post.body}</p>
            </div>
            <div className="post-footer">
              <span className="post-id">ID: {post.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
