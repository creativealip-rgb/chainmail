import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/topbar/TopBar";
import { MailboxView } from "@/components/mailbox/MailboxView";
import { Composer } from "@/components/composer/Composer";
import { useParams } from "react-router-dom";

interface Props {
  labelView?: boolean;
}

export default function MailboxRoute({ labelView }: Props) {
  const params = useParams<{ mailbox?: string; labelId?: string }>();
  // When labelView is true, treat as label filter; otherwise as folder
  const folderId = labelView ? undefined : params.mailbox ?? "inbox";
  const labelId = labelView ? params.labelId : undefined;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <MailboxView mailboxId={folderId ?? "inbox"} labelId={labelId} />
      </div>
      <Composer />
    </div>
  );
}
