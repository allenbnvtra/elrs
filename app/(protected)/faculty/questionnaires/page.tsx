'use client';

import BSABENQuestionsPage from "@/components/bsaben-questions/BSABENQuestionsPage";
import BSGEQuestionsPage from "@/components/bsge-questions/BSGEQuestionsPage";
import { useAuth } from "@/contexts/authContext";

const QuestionsPage = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;
  if (user.role !== "faculty") return <div>Unauthorized</div>;

  return user.course === "BSABEN" ? <BSABENQuestionsPage /> : <BSGEQuestionsPage />;
};

export default QuestionsPage;