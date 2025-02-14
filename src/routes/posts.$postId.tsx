import { createFileRoute } from "@tanstack/react-router";
import { Post } from "../pages/post";

export const Route = createFileRoute("/posts/$postId")({
  component: Post,
  loader: async ({ params }) => {
    return { postId: Number(params.postId) };
  },
});
