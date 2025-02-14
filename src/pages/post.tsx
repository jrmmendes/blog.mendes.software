import { FC, useEffect } from "react";
import { Route } from "../routes/posts.$postId";
import matter from "front-matter";
import source from "../content/dockerizando-um-projeto-node-js/index.md";
import { useRemark } from "react-remark";

export const Post: FC = () => {
  const { postId } = Route.useParams();
  const [reactContent, setMarkdownSource] = useRemark();
  const { attributes, body } = matter<{ title: string; date: string }>(source);
  useEffect(() => {
    setMarkdownSource(body);
  });

  return (
    <section>
      <h1>
        # {postId} {attributes.title} @ {attributes.date}
      </h1>
      {reactContent}
    </section>
  );
};
