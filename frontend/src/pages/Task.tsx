import { useParams } from "react-router-dom";
import { TaskPage } from "@/components/task/task-page";

export default function Task() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <TaskPage jobId={id} />;
}
