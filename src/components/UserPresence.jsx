import React, { memo, useEffect, useState } from "react";
import { Users, PencilSimple } from "@phosphor-icons/react";

/**
 * UserAvatar component displays a single user's avatar with their initial
 * @param {Object} props - Component props
 * @param {string} props.initial - User's initial letter
 * @param {string} props.color - Background color for the avatar
 * @param {string} props.title - Tooltip text (usually user ID or name)
 * @param {boolean} props.isDrawing - Whether the user is currently drawing
 * @param {string} props.transitionClass - Additional class for transition effects
 */
const UserAvatar = memo(
  ({ initial, color, title, isDrawing, transitionClass = "" }) => (
    <div
      className={`relative transition-all duration-500 ease-in-out transform ${
        isDrawing ? "scale-110 z-10" : ""
      } ${transitionClass}`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
        style={{ backgroundColor: color }}
        title={title}
      >
        {initial}
      </div>
      {isDrawing && (
        <div
          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 w-4 h-4 flex items-center justify-center animate-pulse"
          title="Currently drawing"
        >
          <PencilSimple size={10} weight="bold" className="text-white" />
        </div>
      )}
    </div>
  )
);

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
  // State to track animation classes
  const [animatedUsers, setAnimatedUsers] = useState([]);

  // Update animated users when user list changes
  useEffect(() => {
    if (!users || users.length === 0) {
      setAnimatedUsers([]);
      return;
    }

    // Map the users to include animation classes
    const newAnimatedUsers = users.map((user) => {
      // Highlight the user who just started drawing
      const recentlyStartedDrawing =
        user.isDrawing &&
        user.lastStatusChange &&
        Date.now() - user.lastStatusChange < 2000;

      const animationClass = recentlyStartedDrawing
        ? "animate-bounce-once"
        : "";

      return {
        ...user,
        animationClass,
      };
    });

    setAnimatedUsers(newAnimatedUsers);
  }, [users]);

  // Don't render anything if there are no users
  if (!users || users.length === 0) {
    return null;
  }

  // Reorder users to put the drawing user at the beginning
  const sortedUsers = [...animatedUsers].sort((a, b) => {
    if (a.isDrawing) return -1;
    if (b.isDrawing) return 1;
    return 0;
  });

  return (
    <div className="fixed left-10 top-4 z-[9998] flex items-center space-x-2">
      <UserCounter count={users.length} />

      <div className="flex items-center">
        {/* Show up to 5 user avatars */}
        <div className="flex transition-all duration-500 ease-in-out">
          {sortedUsers.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className={`transition-all duration-500 ease-in-out ${
                user.isDrawing ? "translate-x-0" : ""
              }`}
              style={{
                marginLeft: index === 0 ? "0" : "-8px",
                zIndex: user.isDrawing ? 20 : 10 - index,
              }}
            >
              <UserAvatar
                initial={user.initial}
                color={user.color}
                title={`User ${user.id.substring(0, 6)}${
                  user.isDrawing ? " (drawing)" : ""
                }`}
                isDrawing={user.isDrawing}
                transitionClass={user.animationClass}
              />
            </div>
          ))}
        </div>

        {/* If there are more than 5 users, show a +X indicator */}
        {users.length > 5 && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-semibold ml-1"
            style={{ marginLeft: "-8px", zIndex: 0 }}
          >
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPresence;
