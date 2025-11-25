import React, { useState } from "react";
import { postService } from "../services/postService";
import { userService } from "../services/userService";
import PostCard from "./PostCard";

export default function Search() {
  const [mode, setMode] = useState("posts"); // "posts" or "users"
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      if (mode === "posts") {
        // Handle hashtag search for posts
        let searchParams = { page, limit: 10 };
        if (term.startsWith('#')) {
          // Remove # and search in tags
          const tagQuery = term.substring(1).trim();
          if (tagQuery) {
            searchParams.tag = tagQuery;
          } else {
            setResults([]);
            setLoading(false);
            return;
          }
        } else {
          searchParams.search = term;
        }
        const res = await postService.getAllPosts(searchParams);
        setResults(res.data.posts);
        setTotalPages(res.data.pagination.pages);
      } else {
        const res = await userService.searchUsers({ search: term, page, limit: 10 });
        setResults(res.data.users);
        setTotalPages(res.data.pagination.pages);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // On page/mode/term change
  React.useEffect(() => {
    if (term) handleSearch();
    // eslint-disable-next-line
  }, [page, mode]);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Search</h2>
      <div className="flex gap-4 items-center mb-6 justify-center">
        <button onClick={() => {setMode("posts");setResults([]);setPage(1);}}
          className={`px-4 py-2 rounded font-semibold ${mode === "posts" ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>Posts</button>
        <button onClick={() => {setMode("users");setResults([]);setPage(1);}}
          className={`px-4 py-2 rounded font-semibold ${mode === "users" ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>Users</button>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8 justify-center">
        <input value={term} onChange={e=>setTerm(e.target.value)} required className="w-2/3 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={mode === "posts" ? "Search posts or use #tag for tag search..." : `Search ${mode}...`} />
        <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded font-bold">Search</button>
      </form>
      {loading ? <div className="text-center">Loading...</div> : (
        results.length === 0 && term ? <div className="text-center text-gray-500">No results found.</div> : (
          mode === "posts" ? (
            <div className="space-y-4">
              {results.map(post => <PostCard key={post._id} post={post} onUpdate={handleSearch} />)}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map(user => (
                <div key={user._id} className="flex items-center py-4 gap-4">
                  <img src={user.profile?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} alt={user.username} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-gray-500 text-sm truncate">{user.email}</div>
                    <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}
      {totalPages > 1 && (
        <div className="flex gap-3 justify-center mt-8">
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50">Prev</button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
