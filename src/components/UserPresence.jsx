import React, { memo } from "react";
import { Users } from "@phosphor-icons/react";

/**
 * UserAvatar component displays a single user's avatar with their initial
 * @param {Object} props - Component props
 * @param {string} props.initial - User's initial letter
 * @param {string} props.color - Background color for the avatar
 * @param {string} props.title - Tooltip text (usually user ID or name)
 */
const UserAvatar = memo(({ initial, color, title }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
    style={{ backgroundColor: color }}
    title={title}
  >
    {initial}
  </div>
));

/**
 * UserCounter component shows the total number of connected users
 * @param {Object} props - Component props
 * @param {number} props.count - Number of connected users
 */
const UserCounter = memo(({ count }) => (
  <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
    <Users size={16} weight="fill" className="text-gray-600 mr-1" />
    <span className="text-xs font-medium text-gray-700">{count}</span>
  </div>
));

/**
 * UserPresence component displays all connected users
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of connected user objects
 */
const UserPresence = ({ users = [] }) => {
  // Don't render anything if there are no users
  if (!users || users.length === 0) {
    return null;
  }

  console.log(users);

  return (
    <div className="fixed left-10 top-4 z-[9998] flex items-center space-x-2">
      <UserCounter count={users.length} />

      <div className="flex -space-x-2">
        {/* Show up to 5 user avatars */}
        {users.slice(0, 5).map((user) => (
          <UserAvatar
            key={user.id}
            initial={user.initial}
            color={user.color}
            title={`User ${user.id.substring(0, 6)}`}
          />
        ))}

        {/* If there are more than 5 users, show a +X indicator */}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-semibold">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPresence;
