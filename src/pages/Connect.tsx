import ChatScreen from "@/components/ChatScreen";
import PageHeader from "@/components/PageHeader";

const Connect = () => (
  <div className="max-w-3xl mx-auto p-4 md:p-8 h-full flex flex-col">
    <PageHeader title="Anonymous Connect" subtitle="Match with a random student on campus" />
    <div className="glass-strong rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[60vh]">
      <ChatScreen />
    </div>
  </div>
);
export default Connect;
