import { FC } from "react";
import { Route } from "../routes/posts.$postId";

export const Post: FC = () => {
  const { postId } = Route.useParams()

  return (
    <section>
      <h1># {postId} Understanding Modern Software Development</h1>
      <p>
        Software development has evolved significantly over the past decade.
        Modern applications leverage cloud infrastructure, microservices
        architecture, and continuous deployment practices. Developers now focus
        on creating scalable, maintainable code using advanced frameworks and
        tools that promote code reusability and testing. The rise of DevOps
        culture has bridged the gap between development and operations teams.
      </p>
    </section>
  );
};
