type AnnouncementItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  class?: { name: string } | null;
};

const bgColors = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];

const Announcements = ({
  announcements = [],
}: {
  announcements?: AnnouncementItem[];
}) => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400 cursor-pointer">View All</span>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {announcements.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No announcements</p>
        )}
        {announcements.map((item, i) => (
          <div
            className={`${bgColors[i % bgColors.length]} rounded-md p-4`}
            key={item.id}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{item.title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Date(item.date).toLocaleDateString("en-GB")}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
            {item.class?.name && (
              <p className="text-xs text-indigo-500 mt-1">{item.class.name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;