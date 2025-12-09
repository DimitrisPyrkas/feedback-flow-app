import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageProps = { params: Promise<{ id: string }> };

type FeedbackDetail = {
  id: string;
  source: string;
  externalId: string;
  rawContent: string;
  originalTimestamp: string;
  createdAt: string;
  status?: "NEW" | "ACKNOWLEDGED" | "ACTIONED";
  user?: { id: string; email: string; role: "ADMIN" | "MEMBER" } | null;
};

export default async function FeedbackDetailPage(props: PageProps) {
  const { id } = await props.params;

  const feedback = (await prisma.feedbackItem.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
  })) as FeedbackDetail | null;

  if (!feedback) {
    return <div className="p-6">Feedback not found.</div>;
  }

  async function markAcknowledged() {
    "use server";

    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    await prisma.feedbackItem.update({
      where: { id },
      data: { status: "ACKNOWLEDGED" },
    });

    revalidatePath(`/feedback/${id}`);
    revalidatePath(`/feedback`);
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Link href="/feedback" className="text-sm text-blue-500 hover:underline">
        ← Back to Feedback
      </Link>

      <div className="space-y-4 border rounded-xl p-6 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <Badge>{feedback.status ?? "NEW"}</Badge>
          <Badge variant="secondary">{feedback.source}</Badge>
        </div>

        <p className="text-lg leading-relaxed">“{feedback.rawContent}”</p>

        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            Created: {new Date(feedback.originalTimestamp).toLocaleString()}
          </p>
          {feedback.user?.email && <p>By: {feedback.user.email}</p>}
        </div>

        <form action={markAcknowledged}>
          <Button type="submit">Mark as Acknowledged</Button>
        </form>
      </div>
    </div>
  );
}
