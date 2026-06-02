import GroupsScreen from "@/components/GroupsScreen";
import PageHeader from "@/components/PageHeader";

const GroupsPage = () => (
  <div className="max-w-3xl mx-auto p-4 md:p-8 h-full flex flex-col">
    <PageHeader title="Groups" subtitle="Chat with multiple friends" />
    <div className="glass-strong rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[60vh]">
      <GroupsScreen />
    </div>
  </div>
);
export default GroupsPage;
