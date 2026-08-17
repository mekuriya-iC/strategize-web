import type { Metadata } from "next";
import { TaskRequestsView } from "@/components/task-collaboration/task-requests-view";

export const metadata: Metadata = {
  title: "Task collaboration requests",
};

export default function TaskRequestsPage() {
  return <TaskRequestsView />;
}
