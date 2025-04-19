import axios from 'axios';
import { useEffect, useState } from 'react';
import BlogFeed from '@/components/blog-feed';
import PostCard from '@/components/post-card';
import Post from '@/types/post-type';
import { PostCardSkeleton } from '@/components/skeletons/post-card-skeleton';
import Header from '@/layouts/header-layout';

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    console.log("VITE_API_PATH:", import.meta.env.VITE_API_PATH);  // Log the value of the env variable
    axios
      .get(import.meta.env.VITE_API_PATH + '/api/posts')
      .then((response) => {
        console.log("Fetched posts:", response.data);  // Log the fetched data
        setPosts(response.data);  // Set the posts data
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);  // Log any errors
      });
  }, []);

  // Log the posts state after it's updated
  console.log("Posts Data:", posts);  // Verify if posts data is updated

  return (
    <div className="w-full cursor-default bg-light dark:bg-dark">
      <Header />
      <div className="mx-4 md:mx-8 lg:mx-16">
        <BlogFeed />
        <h1 className="cursor-text pb-4 text-xl font-semibold dark:text-dark-primary sm:pb-0">
          Batch 7 is amazing
        </h1>
        <div className="flex flex-wrap">
          {posts.length === 0
            ? Array(8)
                .fill(0)
                .map((_, index) => <PostCardSkeleton key={index} />)
            : posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
