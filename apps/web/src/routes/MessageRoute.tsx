import { useParams } from "react-router-dom";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/topbar/TopBar";
import { MessageView } from "@/components/message/MessageView";

export default function MessageRoute() {
  const { mailbox, id } = useParams<{ mailbox: string; id: string }>();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <MessageView messageId={id ?? ""} />
      </div>
    </div>
  );
}
